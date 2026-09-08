'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';
import { useRouter } from '@/i18n/navigation';
import {
  useNavigationInterceptor,
  useUnsavedChangesGuard,
} from '@/components/navigation/navigation-guard-context';
import { Button } from '@/components/design/design-system/button';
import { IntakeChatShell } from '@/components/design/intake/components/intake-chat-shell';
import { ChatComposer } from '@/components/design/intake/chat/chat-composer';
import { TypingIndicator } from '@/components/design/intake/chat/typing-indicator';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { recordCreatedTitle, readCreatedTitles } from './created-cases';
import { deriveCaseTitle, deriveDescription, deriveTitle } from './extract';
import { describeFile, toIntakeFiles } from './file-utils';
import { IntakeBriefPanel } from './intake-brief-panel';
import { AssistantTurn, UserTurn } from './intake-message';
import {
  DOCUMENTS_KEY,
  MATTER_TYPE_KEY,
  RECAP_KEY,
  type AnswersMap,
  type IntakeFile,
  type IntakeMessage,
  type IntakeState,
  type MatterId,
  type StepResult,
  type SuggestionChip,
} from './intake-types';
import { LeaveIntakeDialog } from './leave-intake-dialog';
import {
  reaskWithNote,
  startIntake,
  stepIntake,
  stepIntakeWith,
} from './script';
import { aiRecap, aiTurn } from './ai/ai-intake-client';
import { useIntakeState } from './use-intake-state';

const newId = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/** Brief pause so Moritz's "typing" indicator reads before a reply lands. */
const THINKING_MS = 650;

/** Give up on an AI turn after this long and fall back to the scripted reply. */
const AI_TIMEOUT_MS = 12000;

/**
 * Conversational case intake (Moritz-style). A scripted assistant walks the
 * client through a fixed sequence of questions with suggestion chips and
 * follow-up logic, filling in a live case brief shown in the docked side panel.
 * Faithful port of the Moritz-dashboard prototype, rebuilt on the Foundation
 * design system and the playground's chat shell. Backend stays stubbed.
 */
export function ConversationalIntakeFlow() {
  const {
    matterId,
    answers,
    currentKey,
    messages,
    files,
    done,
    hydrated,
    appendMessage,
    updateMessage,
    setCurrentKey,
    setMatterId,
    mergeAnswers,
    setFiles,
    setDone,
    titleOverride,
    setTitleOverride,
    aiSummaries,
    setAiSummaries,
    reset,
  } = useIntakeState();

  const router = useRouter();
  const { flags } = useDesignFlags();
  const enterprise = Boolean(flags.useEnterpriseAccount);
  const aiEnabled = Boolean(flags.useAiCaseIntake);

  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  // Set when the recap's "Keep editing" is pressed, revealing the composer so
  // the client can add more before submitting.
  const [refining, setRefining] = useState(false);
  // Files docked in the composer awaiting the next send (ChatGPT-style). On send
  // they attach to the message and are committed into the case `files`.
  const [pendingFiles, setPendingFiles] = useState<IntakeFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean;
    reason: 'navigate' | 'restart';
  }>({ open: false, reason: 'restart' });

  const startedRef = useRef(false);
  // Messages present at hydration shouldn't re-stream on load; only turns added
  // during this session animate in.
  const initialCountRef = useRef<number | null>(null);
  // Pending "thinking" reply timer, so the Stop control can cancel it.
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In-flight AI turn controller, so Stop can abort it.
  const aiAbortRef = useRef<AbortController | null>(null);
  // Latest title override, read inside async callbacks without stale closures.
  const titleOverrideRef = useRef<string | undefined>(titleOverride);
  titleOverrideRef.current = titleOverride;
  // AI-generated case description, used by the stubbed submission when present.
  const aiDescriptionRef = useRef<string | null>(null);
  // Destination held while the leave-confirmation dialog is open (navigate flow).
  const pendingHrefRef = useRef<string | null>(null);

  // Active (and thus guarded) whenever the client has said anything and the case
  // hasn't been submitted yet. Submitting clears the transcript via
  // `performRestart`, so we don't need to special-case `done` here — the recap
  // step is still unsaved work and must prompt before leaving.
  // Set once the case is submitted, when the closing "submitted" card lands.
  // Derived from the transcript so it survives a refresh (the snapshot persists).
  const submitted = useMemo(
    () => messages.some((m) => m.card?.type === 'submitted'),
    [messages],
  );

  const hasActiveIntake = useMemo(
    () => messages.some((m) => m.role === 'user'),
    [messages],
  );

  const buildState = useCallback(
    (): IntakeState => ({ matterId, answers, currentKey, files, done }),
    [matterId, answers, currentKey, files, done],
  );

  // Kick off the opening greeting once hydrated (unless we're resuming a chat
  // that already has a user reply).
  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;
    if (initialCountRef.current === null) {
      initialCountRef.current = messages.length;
    }
    const hasUserReply = messages.some((m) => m.role === 'user');
    if (hasUserReply || messages.length > 0) return;

    setThinking(true);
    const timer = setTimeout(() => {
      const result = startIntake();
      appendMessage(result.assistantMessage);
      mergeAnswers(result.answerPatch);
      if (result.matterId) setMatterId(result.matterId);
      setCurrentKey(result.nextCurrentKey);
      if (result.done) setDone(true);
      setThinking(false);
    }, THINKING_MS);
    // Reset the guard on cleanup so React Strict Mode's dev double-invoke
    // reschedules the greeting instead of dropping it.
    return () => {
      clearTimeout(timer);
      startedRef.current = false;
    };
  }, [
    hydrated,
    messages,
    appendMessage,
    mergeAnswers,
    setMatterId,
    setCurrentKey,
    setDone,
  ]);

  // Block in-app navigation (top-nav "Back to home", brand, section pills) and
  // tab unloads while an intake is in progress. The interceptor takes over
  // guarded navigation to show the intake's own save-draft / delete dialog
  // instead of the generic unsaved-changes alert.
  // Once submitted, the work is saved as a case — drop the guard so the client
  // can follow the confirmation's links (or restart) without a leave prompt.
  useUnsavedChangesGuard(hasActiveIntake && !submitted);
  useNavigationInterceptor((href) => {
    if (!hasActiveIntake || submitted) return false;
    pendingHrefRef.current = href;
    setLeaveDialog({ open: true, reason: 'navigate' });
    return true;
  });

  // Apply a computed step result to state (records answers, advances, replies).
  const applyStep = useCallback(
    (result: StepResult) => {
      mergeAnswers(result.answerPatch);
      if (result.matterId) setMatterId(result.matterId);
      setCurrentKey(result.nextCurrentKey);
      appendMessage(result.assistantMessage);
      if (result.done) setDone(true);
    },
    [mergeAnswers, setMatterId, setCurrentKey, appendMessage, setDone],
  );

  // Once the recap is reached, ask Claude for a suggested title (pre-filled into
  // the editable name if the client hasn't set one) and a lawyer-ready blurb.
  const enrichRecap = useCallback(
    async (matter: MatterId | undefined, ans: AnswersMap) => {
      const rec = await aiRecap({ matterId: matter ?? null, answers: ans });
      if (!rec) return;
      if (rec.title && !titleOverrideRef.current?.trim()) {
        setTitleOverride(rec.title);
      }
      if (rec.description) aiDescriptionRef.current = rec.description;
      if (rec.summaries) setAiSummaries(rec.summaries);
    },
    [setTitleOverride, setAiSummaries],
  );

  const sendUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      // Attachments alone are enough to send (ChatGPT-style); block only a truly
      // empty submission with nothing docked.
      const attached = pendingFiles;
      if ((!trimmed && attached.length === 0) || thinking) return;
      // When the message is attachments-only, feed the engine a short summary so
      // the conversation still has an answer to advance on, while the bubble
      // itself stays text-free and shows just the file chips.
      const engineText =
        trimmed ||
        `${attached.length} file${attached.length === 1 ? '' : 's'} attached`;
      // Docked composer files ride along with this message (ChatGPT-style): they
      // render on the bubble, get committed into the case `files`, then clear.
      const userMsg: IntakeMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
        ...(attached.length ? { attachments: attached } : {}),
      };
      appendMessage(userMsg);
      if (attached.length) {
        setFiles([...files, ...attached]);
        setPendingFiles([]);
      }
      setDraft('');
      setThinking(true);
      const stateForCall = buildState();

      // Deterministic path (flag off): the original scripted engine, unchanged.
      if (!aiEnabled) {
        thinkTimerRef.current = setTimeout(() => {
          thinkTimerRef.current = null;
          applyStep(stepIntake(stateForCall, engineText));
          setThinking(false);
        }, THINKING_MS);
        return;
      }

      // AI path: one round-trip augments the same deterministic engine. Any
      // failure/timeout falls back to the scripted reply; a user Stop aborts.
      const controller = new AbortController();
      aiAbortRef.current = controller;
      const timeout = setTimeout(
        () => controller.abort('timeout'),
        AI_TIMEOUT_MS,
      );
      const transcript = messages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      void (async () => {
        const res = await aiTurn(
          {
            matterId: stateForCall.matterId ?? null,
            awaitedKey: stateForCall.currentKey,
            answers: stateForCall.answers,
            userMessage: engineText,
            transcript,
          },
          controller.signal,
        );
        clearTimeout(timeout);
        aiAbortRef.current = null;

        // User pressed Stop: leave the transcript as-is (thinking already off).
        if (controller.signal.aborted && controller.signal.reason === 'user') {
          return;
        }

        if (!res) {
          applyStep(stepIntake(stateForCall, engineText));
          setThinking(false);
          return;
        }

        if (res.offScript) {
          applyStep(reaskWithNote(stateForCall, res.offScript.answer));
          setThinking(false);
          return;
        }

        const isMatterType = stateForCall.currentKey === MATTER_TYPE_KEY;
        const msgForStep =
          isMatterType && res.matterId ? res.matterId : engineText;
        const result = stepIntakeWith(stateForCall, msgForStep, {
          classifiedMatterId: res.matterId ?? undefined,
          extractedAnswers: res.extracted,
          acknowledgement: res.acknowledgement,
        });
        applyStep(result);
        setThinking(false);

        if (result.done) {
          const finalMatter = result.matterId ?? stateForCall.matterId;
          const finalAnswers: AnswersMap = {
            ...stateForCall.answers,
            ...result.answerPatch,
          };
          void enrichRecap(finalMatter, finalAnswers);
        }
      })();
    },
    [
      thinking,
      appendMessage,
      buildState,
      aiEnabled,
      messages,
      applyStep,
      enrichRecap,
      files,
      pendingFiles,
      setFiles,
    ],
  );

  const onChip = useCallback(
    (chip: SuggestionChip) => sendUserMessage(chip.label),
    [sendUserMessage],
  );

  const onSkipQuestion = useCallback(
    () => sendUserMessage('Skip'),
    [sendUserMessage],
  );

  // Advance the documents step without typing in the composer: attaching files
  // (or hitting Skip) moves the conversation on. Guarded to the documents step
  // so attaching from the composer at other times never skips ahead.
  const resolveDocuments = useCallback(
    (kind: 'attach' | 'skip') => {
      if (currentKey !== DOCUMENTS_KEY || thinking) return;
      const message =
        kind === 'skip'
          ? 'Skip'
          : `${files.length} file${files.length === 1 ? '' : 's'} attached`;
      sendUserMessage(message);
    },
    [currentKey, thinking, files.length, sendUserMessage],
  );

  // Committed case files (documents step + files sent with messages). Used by
  // the inline AttachCard and the brief panel.
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setFiles([...files, ...toIntakeFiles(incoming)]);
    },
    [files, setFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles(files.filter((f) => f.id !== id));
    },
    [files, setFiles],
  );

  // Pending composer attachments (not yet sent). The paperclip adds here; the
  // dock chip's X removes here. On send they move onto the message + `files`.
  const addPendingFiles = useCallback((incoming: FileList | File[]) => {
    setPendingFiles((prev) => [...prev, ...toIntakeFiles(incoming)]);
  }, []);

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Docked composer chips mirror the inline AttachCard: colored per-type icon +
  // filename only. A non-empty dock enables sending on its own (ChatGPT-style),
  // so a file can be sent without any accompanying text.
  const composerAttachments = useMemo(
    () =>
      pendingFiles.map((f) => {
        const { Icon, colorClass } = describeFile(f.name);
        return {
          id: f.id,
          name: f.name,
          icon: Icon,
          iconClassName: colorClass,
          state: 'done' as const,
        };
      }),
    [pendingFiles],
  );

  const onStop = useCallback(() => {
    if (thinkTimerRef.current) {
      clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    if (aiAbortRef.current) {
      aiAbortRef.current.abort('user');
      aiAbortRef.current = null;
    }
    setThinking(false);
  }, []);

  const performRestart = useCallback(() => {
    if (aiAbortRef.current) {
      aiAbortRef.current.abort('user');
      aiAbortRef.current = null;
    }
    aiDescriptionRef.current = null;
    reset();
    startedRef.current = false;
    initialCountRef.current = 0;
    setDraft('');
    setRefining(false);
  }, [reset]);

  const onRestart = useCallback(() => {
    if (!hasActiveIntake) {
      performRestart();
      return;
    }
    setLeaveDialog({ open: true, reason: 'restart' });
  }, [hasActiveIntake, performRestart]);

  // After a leave action, complete the navigation that triggered the dialog.
  const resumePendingNavigation = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) router.push(href);
  }, [router]);

  const onLeaveSaveDraft = useCallback(() => {
    toast.success('Saved as draft', {
      description: 'Your in-progress case stays here on this device.',
    });
    resumePendingNavigation();
  }, [resumePendingNavigation]);

  const onLeaveDiscard = useCallback(() => {
    performRestart();
    toast('Case deleted', {
      description: 'Your in-progress intake has been cleared.',
    });
    resumePendingNavigation();
  }, [performRestart, resumePendingNavigation]);

  // Submit straight from the recap: the title is derived automatically
  // ("{party} {Matter}", de-duplicated), so the client never names the case.
  // The recap turn transforms in place into the closing confirmation (lawyers +
  // ETA) rather than a new card being appended below it.
  const onSubmitCase = useCallback(() => {
    if (submitting || submitted) return;
    setSubmitting(true);
    // Honour a client-named case verbatim; otherwise auto-derive (and de-dupe).
    const override = titleOverride?.trim();
    const title = override
      ? override
      : deriveCaseTitle(matterId, answers, readCreatedTitles());
    // Stubbed submission (no backend in the playground).
    setTimeout(() => {
      const description =
        aiDescriptionRef.current ?? deriveDescription(matterId, answers);
      void description;
      recordCreatedTitle(title);
      const submittedContent = `You're all set \u2014 I've opened ${title} and the team has been notified. Here's what happens next.`;
      const submittedCard = { type: 'submitted', title } as const;
      const recap = messages.find((m) => m.card?.type === 'recap');
      if (recap) {
        // Swap in a fresh id so the turn remounts and the copy streams in like a
        // new Moritz message (the recap card is replaced in place, not appended).
        updateMessage(recap.id, {
          id: newId(),
          content: submittedContent,
          card: submittedCard,
        });
      } else {
        // Fallback: append if the recap turn isn't present for some reason.
        appendMessage({
          id: newId(),
          role: 'assistant',
          content: submittedContent,
          createdAt: new Date().toISOString(),
          card: submittedCard,
        });
      }
      toast.success('Case submitted', {
        description: `"${title}" is on its way to the team.`,
      });
      setRefining(false);
      setSubmitting(false);
    }, 900);
  }, [
    submitting,
    submitted,
    matterId,
    answers,
    titleOverride,
    messages,
    updateMessage,
    appendMessage,
  ]);

  // Effective case name: a client override wins over the auto-derived title.
  const derivedTitle = matterId ? deriveTitle(matterId, answers) : 'New case';
  const caseTitle = titleOverride?.trim() ? titleOverride : derivedTitle;
  const headerTitle = caseTitle;
  const initialCount = initialCountRef.current ?? 0;

  // The documents and recap steps are resolved on their inline cards, so the
  // composer would only distract. Hide the whole footer for them (and once the
  // case is submitted); the recap's "Keep editing" sets `refining` to bring it
  // back.
  const footerHidden =
    submitted ||
    currentKey === DOCUMENTS_KEY ||
    (currentKey === RECAP_KEY && !refining);

  const transcript = messages.map((m, idx) => {
    if (m.role === 'user') return <UserTurn key={m.id} message={m} />;
    const isLast = idx === messages.length - 1;
    let selectedChipValue: string | undefined;
    if (m.card?.type === 'chips' && idx + 1 < messages.length) {
      const next = messages[idx + 1];
      if (next?.role === 'user') {
        const reply = next.content.trim().toLowerCase();
        const match = m.card.chips.find(
          (c) =>
            c.label.trim().toLowerCase() === reply ||
            c.value.trim().toLowerCase() === reply,
        );
        selectedChipValue = match?.value;
      }
    }
    return (
      <AssistantTurn
        key={m.id}
        message={m}
        matterId={matterId}
        answers={answers}
        summaries={aiSummaries}
        files={files}
        interactive={isLast && !thinking}
        selectedChipValue={selectedChipValue}
        stream={isLast && idx >= initialCount && !thinking}
        onChip={onChip}
        onSkipQuestion={onSkipQuestion}
        onAddFiles={addFiles}
        onRemoveFile={removeFile}
        onSkipAttachments={() => resolveDocuments('skip')}
        onContinueAttachments={() => resolveDocuments('attach')}
        onSubmit={onSubmitCase}
        onEdit={() => setRefining(true)}
        onStartAnother={onRestart}
        caseTitle={caseTitle}
        onCaseTitleChange={setTitleOverride}
        enterprise={enterprise}
        submitting={submitting}
      />
    );
  });

  return (
    <>
      <IntakeChatShell
        title={headerTitle}
        panel={
          <IntakeBriefPanel
            matterId={matterId}
            answers={answers}
            files={files}
            currentKey={currentKey}
            submitted={submitted}
          />
        }
        panelFooter={
          hasActiveIntake && !submitted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRestart}
            >
              Start over
            </Button>
          ) : undefined
        }
        footer={
          <div
            aria-hidden={footerHidden}
            className={cn(
              'transition-all duration-300 ease-out',
              footerHidden
                ? 'pointer-events-none max-h-0 -translate-y-1 overflow-hidden opacity-0'
                : 'max-h-[280px] translate-y-0 opacity-100',
            )}
          >
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={(text) => sendUserMessage(text)}
              onAttach={addPendingFiles}
              attachments={composerAttachments}
              onRemoveAttachment={removePendingFile}
              onStop={onStop}
              busy={thinking}
              disabled={footerHidden}
              placeholder="Message Moritz…"
            />
          </div>
        }
      >
        {transcript}
        {thinking ? <TypingIndicator /> : null}
      </IntakeChatShell>

      <LeaveIntakeDialog
        open={leaveDialog.open}
        onOpenChange={(open) => setLeaveDialog((prev) => ({ ...prev, open }))}
        onCancel={() => {
          pendingHrefRef.current = null;
        }}
        onSaveDraft={onLeaveSaveDraft}
        onDiscard={onLeaveDiscard}
        reason={leaveDialog.reason}
      />
    </>
  );
}
