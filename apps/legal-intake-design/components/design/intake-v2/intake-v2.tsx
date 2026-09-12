'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useNavigationInterceptor,
  useUnsavedChangesGuard,
} from '@/components/navigation/navigation-guard-context';
import type { ComposerAttachment } from '@/components/design/intake/chat/chat-composer';
import { Button } from '@/components/design/foundations/components/button';
import { LeaveIntakeDialog } from '@/components/design/new-case/leave-intake-dialog';
import { fileToBase64 } from '@/lib/image-utils';
import {
  DEMO_CONFIRMED_KEY,
  DEMO_FIELD_UPDATES,
} from '@/lib/intake/demo-brief';
import { chipsForMatter, hintsForMatter } from '@/lib/intake/matter-fields';
import { MATTER_TYPE_KEY } from '@/components/design/new-case/intake-types';
import { clearIntakeSession } from '@/lib/intake/session-storage';
import { BriefColumn } from './brief-column';
import { BriefOutline } from './brief-outline';
import { SuggestionChips } from './suggestion-chips';
import { ChatColumn } from './chat-column';
import { useBrief } from './use-brief';
import { useConversation } from './use-conversation';

/** Decision 15: only file types a legal intake can actually use. */
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx'];

function isAcceptedFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_EXTENSIONS.includes(extension);
}

/** `fileToBase64` returns a data URI; the API wants the payload on its own. */
function stripDataUri(dataUri: string): string {
  const comma = dataUri.indexOf(',');
  return comma === -1 ? dataUri : dataUri.slice(comma + 1);
}

/**
 * Intake v2, the redesigned client intake.
 *
 * Renders unconditionally at `/client/new`: no feature flag, no engagement gate
 * (Decision 28). The layout follows the phase (Decision 18): one column until
 * the conversation starts, then the chat and the brief side by side.
 */
export function IntakeV2() {
  const t = useTranslations('intake');
  const router = useRouter();

  const {
    brief,
    hydrated,
    applyUpdates,
    confirm,
    progress,
    reset,
    setTitle,
    isComplete,
  } = useBrief('contract');
  const { messages, busy, error, send, say, clear, chooseChip, setError } =
    useConversation({ brief, applyUpdates, hydrated });

  const hints = useMemo(() => hintsForMatter('contract'), []);
  const chipsByField = useMemo(() => chipsForMatter('contract'), []);

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  // Fills the picked chip in before the screen changes, so the click is
  // acknowledged rather than swallowed by the layout switch.
  const [startChoice, setStartChoice] = useState<string | undefined>(undefined);

  const hasActiveIntake =
    messages.length > 0 || brief.fields.some((field) => field.value !== null);

  // ---------------------------------------------------------------- leaving

  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean;
    reason: 'navigate' | 'restart';
  }>({ open: false, reason: 'navigate' });
  const pendingHrefRef = useRef<string | null>(null);

  // Covers a refresh or a closed tab. The interceptor below takes over in-app
  // navigation so the intake shows its own save-or-delete dialog rather than
  // the generic unsaved-changes alert.
  useUnsavedChangesGuard(hasActiveIntake);
  useNavigationInterceptor((href) => {
    if (!hasActiveIntake) return false;
    pendingHrefRef.current = href;
    setLeaveDialog({ open: true, reason: 'navigate' });
    return true;
  });

  const resumePendingNavigation = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) router.push(href);
  }, [router]);

  const performRestart = useCallback(() => {
    clearIntakeSession();
    reset();
    clear();
    setAttachments([]);
  }, [clear, reset]);

  const onLeaveSaveDraft = useCallback(() => {
    toast.success(t('leave.savedTitle'), {
      description: t('leave.savedDescription'),
    });
    resumePendingNavigation();
  }, [resumePendingNavigation, t]);

  const onLeaveDiscard = useCallback(() => {
    performRestart();
    toast(t('leave.deletedTitle'), {
      description: t('leave.deletedDescription'),
    });
    resumePendingNavigation();
  }, [performRestart, resumePendingNavigation, t]);

  // --------------------------------------------------------------- uploads

  const runExtraction = useCallback(
    async (file: File) => {
      const attachmentId = `a_${Date.now()}`;
      setAttachments([
        { id: attachmentId, name: file.name, state: 'processing' },
      ]);

      try {
        const base64 = stripDataUri(await fileToBase64(file));
        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `Read this document and fill in what you can. Field keys: ${brief.fields
                  .map((field) => field.key)
                  .join(', ')}.`,
              },
            ],
            documents: [base64],
            // Named back to the client as the source: "vendor-agreement.pdf,
            // clause 11.3". Without it the brief can only say "the document".
            documentName: file.name,
          }),
        });

        const result = (await response.json()) as {
          fields?: unknown[];
          verifiedCount?: number;
          error?: string;
        };

        if (!response.ok || result.error) {
          throw new Error(result.error ?? t('upload.failed'));
        }

        const fields = result.fields ?? [];
        applyUpdates(fields);
        setAttachments([]);

        // Decision 2: say out loud what was found, and be honest about how
        // much of it could be traced back to the document.
        say(
          fields.length === 0
            ? t('upload.nothingFound', { name: file.name })
            : t('upload.found', {
                name: file.name,
                count: fields.length,
                verified: result.verifiedCount ?? 0,
              }),
        );
      } catch (caught) {
        setAttachments([]);
        setError(caught instanceof Error ? caught.message : t('upload.failed'));
      }
    },
    [applyUpdates, brief.fields, say, setError, t],
  );

  const onAttach = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (!isAcceptedFile(file)) {
        setError(t('upload.wrongType'));
        return;
      }
      setError(null);
      void runExtraction(file);
    },
    [runExtraction, setError, t],
  );

  // ----------------------------------------------------------------- recap

  // Name the case once every required field has a value. Runs once, a title
  // is a name, not a live readout, and it stays renameable afterwards.
  const recapRequested = useRef(false);
  useEffect(() => {
    if (!isComplete || brief.title !== null || recapRequested.current) return;
    recapRequested.current = true;

    void (async () => {
      try {
        const response = await fetch('/api/recap', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ brief }),
        });
        const result = (await response.json()) as { title?: string };
        if (response.ok && typeof result.title === 'string') {
          setTitle(result.title);
        }
      } catch {
        // A missing title is survivable; the confirmation falls back to the
        // matter type rather than blocking the client.
      }
    })();
  }, [brief, isComplete, setTitle]);

  // ------------------------------------------------------------------ demo

  useEffect(() => {
    if (!hydrated) return;
    if (!new URLSearchParams(window.location.search).has('demo')) return;
    if (brief.fields.some((field) => field.value !== null)) return;
    applyUpdates(DEMO_FIELD_UPDATES);
    confirm(DEMO_CONFIRMED_KEY);
    // A message as well, so the demo opens in the conversation view where the
    // brief actually lives. Seeding only the brief would land on the opening
    // screen, which shows the outline and none of the rows being reviewed.
    say(t('demo.seeded'));
    // Seed once, on arrival, when the brief is still empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ---------------------------------------------------------------- render

  const started = messages.length > 0;

  const chat = (
    <ChatColumn
      messages={messages}
      busy={busy}
      error={error}
      attachments={attachments}
      chipsByField={chipsByField}
      onSend={(text) => void send(text)}
      onChooseChip={(messageId, chipValue, label) => {
        chooseChip(messageId, chipValue);
        void send(label);
      }}
      onAttach={onAttach}
      onRemoveAttachment={() => setAttachments([])}
    />
  );

  // Anchored to the bottom of the brief column. Before the conversation starts
  // it sets expectations; once it is running it carries the commercial step the
  // old flow never mentioned (Decision 7) and the action that follows it.
  const briefFooter = (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t('quote.explanation')}
      </p>
      <Button type="button" className="w-full" disabled={!isComplete}>
        {t('quote.action')}
      </Button>
    </div>
  );

  const briefPanel = (
    <BriefColumn
      brief={brief}
      hints={hints}
      progress={progress}
      footer={briefFooter}
      onConfirm={(key) => confirm(key)}
      onEdit={(key, value) => confirm(key, value)}
    />
  );

  // Before anything is said, the composer is the whole point of the screen: one
  // centred column, with the brief below it as a boxed preview of what this
  // kind of matter needs. Once the conversation starts the split takes over and
  // the brief steps out of its box onto the page (Decision 18).
  if (!started) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-[680px] flex-col px-4 py-10 sm:px-6">
        {/*
         * `my-auto` rather than `justify-center`: it centres the column when
         * there is room, and quietly gives up when there is not, letting the
         * page scroll instead. Centring a flex column that overflows clips the
         * top of it, which is how a short laptop screen loses the heading.
         */}
        <div className="my-auto flex flex-col gap-8">
          <header className="flex flex-col gap-3 text-center">
            <h1 className="text-foreground font-serif text-3xl tracking-tight">
              {t('start.heading')}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-xl text-base">
              {t('start.subheading')}
            </p>
          </header>

          {chat}

          {/*
           * A way in for someone who does not know how to begin. Below the
           * composer and under a quiet lead-in: typing or dropping a document is
           * the flow, and these must not compete with it.
           */}
          <SuggestionChips
            chips={chipsByField[MATTER_TYPE_KEY] ?? []}
            label={t('start.orStartWith')}
            {...(startChoice !== undefined
              ? { selectedValue: startChoice }
              : {})}
            onSelect={(chip) => {
              setStartChoice(chip.value);
              void send(chip.label);
            }}
          />

          <BriefOutline fields={brief.fields} />
        </div>

        <LeaveIntakeDialog
          open={leaveDialog.open}
          onOpenChange={(open) =>
            setLeaveDialog((previous) => ({ ...previous, open }))
          }
          onCancel={() => {
            pendingHrefRef.current = null;
          }}
          onSaveDraft={onLeaveSaveDraft}
          onDiscard={onLeaveDiscard}
          reason={leaveDialog.reason}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col">
      {/*
       * Two halves that actually fill the width, rather than a narrow chat
       * floating in a wide column.
       *
       * The sizing is a compromise between two things that pull against each
       * other. Prose gets hard to read much past 900px, so the chat cannot just
       * stretch. A label-and-value list stops reading as a document once the
       * values drift far from their labels, so the brief cannot either.
       *
       * So the brief takes what it needs and no more (up to 34rem), the chat
       * takes everything left up to a readable 56rem, and the page caps at
       * 1600. On a 1440 or 1512 laptop that lands with almost nothing wasted:
       * the brief sits at its full width and the chat fills the rest. Margin
       * only appears past about 1600, which is where every layout needs some.
       *
       * Stacked on a phone with the brief first: the case taking shape is the
       * thing worth seeing, and the composer is a scroll away.
       */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)]">
        <div className="order-2 flex min-h-0 flex-col px-4 py-8 sm:px-6 lg:order-1 lg:pl-10 lg:pr-8">
          <div className="mx-auto flex min-h-0 w-full max-w-[56rem] flex-1 flex-col">
            {chat}
          </div>
        </div>
        <div className="border-border mz-scrollbar-on-scroll order-1 min-h-0 overflow-y-auto px-4 py-8 sm:px-6 lg:order-2 lg:border-l lg:pl-8 lg:pr-10">
          {briefPanel}
        </div>
      </div>

      <LeaveIntakeDialog
        open={leaveDialog.open}
        onOpenChange={(open) =>
          setLeaveDialog((previous) => ({ ...previous, open }))
        }
        onCancel={() => {
          pendingHrefRef.current = null;
        }}
        onSaveDraft={onLeaveSaveDraft}
        onDiscard={onLeaveDiscard}
        reason={leaveDialog.reason}
      />
    </div>
  );
}
