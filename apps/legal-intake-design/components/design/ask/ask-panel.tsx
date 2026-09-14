'use client';

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen, FolderOpen, Sparkles } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MobileSheet } from '@/components/design/mobile/mobile-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/design/design-system/button';
import { ChatComposer } from '@/components/design/intake/chat/chat-composer';
import { MarkdownContent } from '@repo/ui/components/markdown-content';
import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/design/foundations/components/message-scroller';
import { useAsk } from './ask-context';
import { useNavigationGuard } from '@/components/navigation/navigation-guard-context';
import { useRouter } from '@/i18n/navigation';
import { countCitedCases, extractAskActions } from '@/lib/ask/actions';
import { buildAskScope } from '@/lib/ask/scope';
import { readAskStream } from '@/lib/ask/stream-client';
import { buildAskSuggestions } from '@/lib/ask/suggestions';
import {
  readAskMode,
  readTranscript,
  writeAskMode,
  writeTranscript,
  type AskMode,
  type AskTurn,
} from '@/lib/ask/session';
import { failureCopyKey, isRetryable } from '@/lib/intake/failure';
import { generateId } from '@/lib/utils';
import type { AuthUser } from '@/lib/types';

/**
 * Ask Nora — a question box over the reader's own cases (task N6).
 *
 * Rebuilt on `@repo/ui` primitives rather than ported: §8.2 counts the source's
 * panel at 543 lines, and most of that is a composer hand-rolled from a bare
 * `Textarea` and `Button` because that project had nothing better. We already
 * have `ChatComposer` (with `busy`, `onStop` and a real send/stop morph),
 * `Bubble`, `MessageScroller` and `MarkdownContent`, so the behaviour is kept
 * and the code is not.
 *
 * Four things here are load-bearing rather than decorative:
 *
 * 1. **The transcript lives in `lib/ask/session.ts`, at module scope.** Opening
 *    Ask from the command palette mounts and unmounts a dialog; React state
 *    would not survive it, and a reader who asked a question, pressed ⌘K to go
 *    and look at the case, then came back would find an empty panel.
 * 2. **Two modes, two isolated transcripts.** Never merged. A general-legal
 *    sentence sharing a thread with a grounded answer becomes citable as the
 *    basis for it, and this app is client-facing.
 * 3. **Actions are derived from the *settled* answer only**, never mid-stream.
 *    A half-written `M-2026-01` is a different reference from `M-2026-0126`.
 * 4. **Failures render copy from a `FailureKind`**, never a message off the
 *    wire (P4).
 */
export function AskPanel({ user }: { user: AuthUser }) {
  const t = useTranslations('ask');
  const { open, setOpen, closeAsk } = useAsk();
  const isMobile = useIsMobile();
  const router = useRouter();
  const navigationGuard = useNavigationGuard();

  const [mode, setMode] = useState<AskMode>(() => readAskMode());
  /*
   * A render counter, not the transcript. The turns themselves are in the
   * module store; this is what tells React something in it changed. Holding
   * them in state as well would be two sources of truth for one list.
   */
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const role = user.company.type;
  const scope = useMemo(() => buildAskScope(role, user), [role, user]);
  const suggestions = useMemo(() => buildAskSuggestions(scope), [scope]);

  /*
   * One `useId` for the whole tab/panel wiring. Two tabs and one panel need
   * three stable ids, and deriving them from a single base keeps them related
   * on the page as well as in the code.
   */
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const tabId = (which: AskMode) => `${baseId}-tab-${which}`;

  const turns = readTranscript(mode);

  const setTurns = useCallback(
    (next: AskTurn[]) => {
      writeTranscript(mode, next);
      rerender();
    },
    [mode, rerender],
  );

  const switchMode = (next: AskMode) => {
    // Stop any turn in flight first: its `done` would otherwise land in the
    // transcript the reader has just switched away from, which is the one place
    // the two modes could bleed into each other.
    abortRef.current?.abort();
    setBusy(false);
    writeAskMode(next);
    setMode(next);
  };

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (text === '') return;

      // Sending mid-turn preempts the running one, matching the composer's own
      // semantics rather than blocking the reader behind an answer they have
      // already decided against.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const history = readTranscript(mode)
        .filter((turn) => !turn.error)
        .map((turn) => ({ role: turn.role, text: turn.text }));

      const answerId = generateId();
      writeTranscript(mode, [
        ...readTranscript(mode),
        { id: generateId(), role: 'user', text },
        { id: answerId, role: 'assistant', text: '' },
      ]);
      setDraft('');
      setBusy(true);
      rerender();

      /** Replace the in-flight answer turn, leaving the rest alone. */
      const patch = (change: Partial<AskTurn>) => {
        writeTranscript(
          mode,
          readTranscript(mode).map((turn) =>
            turn.id === answerId ? { ...turn, ...change } : turn,
          ),
        );
        rerender();
      };

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // No role, no user, no case list. The server reads the role from the
          // cookie; anything sent from here is something a reader could change.
          body: JSON.stringify({ mode, history, message: text }),
          signal: controller.signal,
        });

        let streamed = '';
        for await (const event of readAskStream(response)) {
          if (controller.signal.aborted) return;
          if (event.type === 'delta') {
            streamed += event.text;
            patch({ text: streamed });
          } else if (event.type === 'done') {
            /*
             * Only now are actions derived. The settled answer is a stable
             * string, so a reference either resolves against the scope or it
             * does not — and a button never appears, changes and vanishes
             * while a sentence is still being written.
             */
            patch({
              text: event.answer,
              actions: extractAskActions(event.answer, scope),
              citedCases: countCitedCases(event.answer, scope),
            });
          } else {
            patch({ error: event.kind });
          }
        }
      } catch (error) {
        // An abort is the reader's own decision, not a failure to report.
        if (controller.signal.aborted) return;
        console.error('[ask] request failed', error);
        patch({ error: 'offline' });
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },
    [mode, rerender, scope],
  );

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const go = (href: string) => {
    closeAsk();
    if (navigationGuard) navigationGuard.navigate(href);
    else router.push(href);
  };

  const hasTurns = turns.length > 0;

  const modeTabs = (
    <AskModeTabs
      mode={mode}
      onChange={switchMode}
      caseCount={scope.cases.length}
      panelId={panelId}
      tabId={tabId}
    />
  );

  /*
   * The transcript is the tab's panel, and now says so. Previously the
   * header carried a `role="tablist"` whose tabs controlled nothing
   * nameable: switching wiped the thread and replaced it, and a screen
   * reader had no way to know the two were related. `aria-labelledby`
   * points back at whichever tab is active, so "Your cases, selected" and
   * the panel beneath it are one thing.
   *
   * Hoisted out of the return because there are two shells around it now —
   * the desktop side sheet and the phone bottom sheet — and the panel itself
   * is identical in both.
   */
  const askBody = (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId(mode)}
      className="flex min-h-0 flex-1 flex-col"
    >
      {hasTurns ? (
        <MessageScrollerProvider autoScroll>
          <div className="flex min-h-0 flex-1 flex-col">
            <MessageScroller>
              <MessageScrollerViewport className="mz-scrollbar-on-scroll px-4 py-4">
                {/*
                 * `MessageScrollerContent` and one `MessageScrollerItem` per
                 * turn, rather than the plain `div` and bare rows this used to
                 * be. Not styling: the two parts are how the scroller learns
                 * that there is a transcript at all.
                 *
                 * `Content` is what installs the MutationObserver and the
                 * ResizeObserver that notice a reply growing, and `Item` is
                 * what registers a turn so the count can change. With neither
                 * of them the scroller saw an empty list that never grew, so
                 * `autoScroll` on the provider above was inert and Nora's
                 * answers streamed off the bottom of the sheet — worst on a
                 * phone, where the panel is short.
                 *
                 * No `scrollAnchor` here, for the reason set out at length in
                 * `chat-message.tsx`: anchoring a turn to the top leaves the
                 * scroller in a mode that stops following the live edge for
                 * the rest of the answer.
                 */}
                <MessageScrollerContent aria-busy={busy} className="gap-4">
                  {turns.map((turn) => (
                    <MessageScrollerItem key={turn.id} messageId={turn.id}>
                      <AskTurnView
                        turn={turn}
                        mode={mode}
                        busy={busy}
                        onGo={go}
                        onRetry={() => {
                          // Retry re-asks the question above this answer,
                          // after dropping the failed pair. Leaving them in
                          // would build a transcript of the reader's bad luck.
                          const index = turns.findIndex(
                            (candidate) => candidate.id === turn.id,
                          );
                          const question = turns[index - 1];
                          if (!question) return;
                          setTurns(turns.slice(0, index - 1));
                          void ask(question.text);
                        }}
                      />
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
            </MessageScroller>
          </div>
        </MessageScrollerProvider>
      ) : (
        /*
         * The empty state, and the D2 consequence: **say what she is,
         * once.** Adopting a named actor reverses this repo's convention
         * that AI surfaces are anonymous, and a name with no explanation
         * invites exactly the question nobody is there to answer.
         *
         * One body per tab. The old single line said she answers from your
         * cases and nothing else, which was simply false on the Legal
         * basics tab, where she is told the opposite and has no case data
         * at all.
         */
        <div className="flex flex-1 flex-col justify-end gap-3 px-4 py-6">
          <h3 className="text-foreground font-serif text-2xl">
            {t('emptyTitle')}
          </h3>
          <p className="text-muted-foreground text-sm/6">
            {mode === 'cases' ? t('emptyBody') : t('emptyBodyGeneral')}
          </p>
        </div>
      )}

      {/*
       * Chips only on an empty thread, and only when the projection has
       * something for them to be about. A row of suggestions over a
       * conversation already in progress is answering a question the reader
       * has stopped asking.
       */}
      {!hasTurns && mode === 'cases' && suggestions.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 pb-2">
          <p className="text-muted-foreground text-xs">
            {t('suggestionsLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                type="button"
                variant="outline"
                size="sm"
                // `whitespace-normal` because Button's base class sets
                // `whitespace-nowrap`, and these chips are whole
                // questions: "Which of my 4 cases need me?" on one
                // unbreakable line overflows a 390px panel.
                className="h-auto whitespace-normal rounded-full py-1.5 text-left text-xs font-normal"
                onClick={() => void ask(suggestion.text)}
              >
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-border border-t p-3">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={(text) => void ask(text)}
          busy={busy}
          onStop={stop}
          // Nora reads case data and cannot take an upload, so a paperclip
          // here would be a control that does nothing.
          showAttach={false}
          placeholder={
            mode === 'cases' ? t('placeholder') : t('placeholderGeneral')
          }
          labels={{ field: t('fieldLabel'), stop: t('stop') }}
        />
      </div>
    </div>
  );

  return isMobile ? (
    /*
     * Nora on a phone is the same bottom sheet the bell, the palette and the
     * account menu use (`MobileSheet`), for the reason spelled out there: one
     * edge, one handle, one dismiss gesture for everything the top bar can
     * open. A chat panel sliding in from the right of a 390px screen was a
     * full-bleed surface pretending to be a sidebar, and the only way out of
     * it was a × in the far corner.
     *
     * Fixed height rather than `max-h`, because this one has a composer
     * anchored to its bottom: on a sheet that sizes to its content, an empty
     * thread would put the input halfway up the screen and then have it walk
     * downward as the conversation grew.
     */
    <MobileSheet
      open={open}
      onOpenChange={setOpen}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="text-muted-foreground size-4" aria-hidden />
          {t('title')}
        </span>
      }
      description={t('description')}
      closeLabel={t('title')}
      headerBelow={modeTabs}
      className="data-[vaul-drawer-direction=bottom]:h-[88svh]"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0 pb-[env(safe-area-inset-bottom)]"
    >
      {askBody}
    </MobileSheet>
  ) : (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-border gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-muted-foreground size-4" aria-hidden />
            <SheetTitle className="text-base">{t('title')}</SheetTitle>
          </div>
          {/*
           * The dialog's accessible description. `sr-only` because the visible
           * answer to "what is she" is now the tab explainer below, which says
           * it per tab and therefore says it accurately. (The comment that used
           * to sit here called this line "visible", which it has never been.)
           */}
          <SheetDescription className="sr-only">
            {t('description')}
          </SheetDescription>
          {modeTabs}
        </SheetHeader>

        {askBody}
      </SheetContent>
    </Sheet>
  );
}

/** One turn. Split out so the panel above reads as a shape, not a wall. */
function AskTurnView({
  turn,
  mode,
  busy,
  onGo,
  onRetry,
}: {
  turn: AskTurn;
  /** Only for the pending line: she is not reading cases on the other tab. */
  mode: AskMode;
  busy: boolean;
  onGo: (href: string) => void;
  onRetry: () => void;
}) {
  const t = useTranslations('ask');

  if (turn.role === 'user') {
    /*
     * L8, applied here from the start: both turns are left-aligned and the
     * speaker is marked by weight rather than by side. A right-aligned bubble
     * would make a panel of three sentences read as a messaging app.
     */
    return (
      <Bubble variant="ghost" align="start">
        <BubbleContent className="text-foreground px-0 text-sm font-medium">
          {turn.text}
        </BubbleContent>
      </Bubble>
    );
  }

  if (turn.error) {
    return (
      <div className="flex flex-col items-start gap-2">
        {/* Copy from a kind, never a sentence off the wire (P4). */}
        <p role="alert" className="text-muted-foreground text-sm/6">
          {t(failureCopyKey(turn.error))}
        </p>
        {isRetryable(turn.error) ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {t('retry')}
          </Button>
        ) : null}
      </div>
    );
  }

  const pending = turn.text === '' && busy;

  return (
    <div className="flex flex-col items-start gap-2">
      {pending ? (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {/* "Nora is reading your cases" is a claim, and on the Legal basics
              tab it is a false one: there is no grounding block in that
              request at all. */}
          {mode === 'cases' ? t('thinking') : t('thinkingGeneral')}
        </p>
      ) : (
        <Bubble variant="ghost" align="start">
          <BubbleContent className="px-0">
            <MarkdownContent
              variant="chat"
              content={turn.text}
              // `streaming` degrades a half-typed link to its own text rather
              // than to an href on an invented protocol.
              streaming={busy}
              className="text-sm/6"
            />
          </BubbleContent>
        </Bubble>
      )}

      {/*
       * §8.6 rule 3 — state the basis. The count is of *distinct, resolved*
       * references, so it is a claim the reader can check: an answer citing an
       * invented number reads "Answered without reading a case", which is the
       * honest description of what happened.
       */}
      {turn.citedCases !== undefined && !pending ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          {turn.citedCases > 0
            ? t('basis', { count: turn.citedCases })
            : t('basisNone')}
        </p>
      ) : null}

      {/*
       * Proposals. Every one is a destination that already exists, and a
       * reference the scope could not resolve produced nothing — so there is no
       * button here that goes somewhere wrong.
       */}
      {turn.actions && turn.actions.length > 0 ? (
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-muted-foreground text-xs">{t('actionsLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {turn.actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                size="sm"
                className={cn('rounded-full text-xs font-normal')}
                onClick={() => onGo(action.href)}
              >
                {action.label}
                <ArrowRight aria-hidden className="size-3" />
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The two tabs, and the line that says what the active one answers from.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT `SegmentedControl` FROM `@repo/ui` ANY MORE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It used to be, and it had one visual bug and three accessibility gaps. The
 * bug was the visible one: `SegmentedControl` is an `inline-flex` whose options
 * carry no `flex-1`, so passing `className="w-full"` stretched the grey trough
 * across the whole sheet while the two pills went on hugging their text. In a
 * `sm:max-w-md` panel that left roughly 175px of empty grey to the right of
 * "General legal" — a control that looked like it had lost a third option.
 *
 * `w-full` was not the mistake. Any fix has to reach the *children*, and the
 * shared component neither exposes them nor forwards arbitrary props, so the
 * choices were to widen its API for its only consumer, or to own the 40 lines.
 * Ask is the only consumer, so this is the cheaper of the two and it also
 * closes the rest:
 *
 * - **The tablist now has a name.** The panel previously rendered an `sr-only`
 *   paragraph immediately before the control and relied on document order,
 *   with a comment explaining that a real `aria-labelledby` would mean editing
 *   the shared package. `aria-label` here is that wiring.
 * - **The tabs now control something.** Each carries `aria-controls` pointing
 *   at the transcript, which is a real `role="tabpanel"`. Before, a screen
 *   reader was told "tab" with nothing on the other end of it.
 * - **Arrow keys work.** A `tablist` is a single tab stop whose options are
 *   reached with Left and Right; the shared component made each pill its own
 *   tab stop and ignored the arrows entirely. Roving `tabIndex` below.
 *
 * `grid-cols-2` rather than two `flex-1` children, because equal halves is the
 * actual intent: with flex the halves stay equal only while both labels are
 * short, and "Legal basics" is one translation away from being the longer one.
 */
function AskModeTabs({
  mode,
  onChange,
  caseCount,
  panelId,
  tabId,
}: {
  mode: AskMode;
  onChange: (next: AskMode) => void;
  /** Drives the explainer, so it carries a real number rather than "your cases". */
  caseCount: number;
  panelId: string;
  tabId: (which: AskMode) => string;
}) {
  const t = useTranslations('ask');
  const hintId = `${panelId}-hint`;

  const tabs = [
    { value: 'cases' as const, label: t('modeCases'), Icon: FolderOpen },
    { value: 'general' as const, label: t('modeGeneral'), Icon: BookOpen },
  ];

  /*
   * Automatic activation: arrowing to a tab selects it, which is the right
   * pattern when switching is instant and lossless. It is, here — each mode
   * keeps its own transcript, so moving between them shows the other thread
   * rather than discarding this one.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = mode === 'cases' ? 'general' : 'cases';
    onChange(next);
    // Follow focus, or the next arrow press comes from the tab we just left.
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="tablist"
        aria-label={t('modeLabel')}
        onKeyDown={onKeyDown}
        className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1"
      >
        {tabs.map(({ value, label, Icon }) => {
          const active = value === mode;
          return (
            <button
              key={value}
              id={tabId(value)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              // The explainer describes the selected tab, so it is announced
              // with it rather than being a stray line of text below.
              aria-describedby={active ? hintId : undefined}
              // Roving tabindex: one tab stop for the pair.
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(value)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2',
                'text-sm font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/*
       * The line that replaced the old conditional banner.
       *
       * That banner appeared only on the general tab, which made the grounded
       * tab the silent default — the one where Nora *is* reading your file said
       * nothing about it, and the one where she is not got a grey warning. This
       * says what the active tab answers from, always, in the same place, and
       * on the grounded tab it carries the actual case count. A reader never
       * has to infer which of the two they are in.
       */}
      <p id={hintId} className="text-muted-foreground text-xs/5">
        {mode === 'general'
          ? t('modeGeneralHint')
          : caseCount === 0
            ? t('modeCasesHintEmpty')
            : t('modeCasesHint', { count: caseCount })}
      </p>
    </div>
  );
}
