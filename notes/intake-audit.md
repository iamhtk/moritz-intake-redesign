# Client intake audit — `/en/client/new`

Read-only audit of the live conversational intake, walked as a first-time client
with no legal background. No code was changed.

**Scope.** `apps/legal-intake-design/components/design/new-case/**` (23 files,
~2,500 LOC), reached via
`app/[locale]/(dashboard)/client/new/page.tsx` →
`components/design/intake/intake-entry.tsx:28` → `ConversationalIntakeFlow`.

**One scope correction.** `components/design/intake/` is not entirely dead. The
live flow imports six live files out of it and will not render without them:
`components/intake-chat-shell.tsx` (layout, docked panel), `chat/chat-composer.tsx`
(the composer, paperclip and mic), `chat/typing-indicator.tsx`,
`chat/streaming-text.tsx`, `chat/collapsible-message-text.tsx`,
`chat/moritz-avatar.tsx`. Real UX defects live in those files, so they are
audited. Everything else under that directory was ignored as instructed.

**Configuration the audit assumes** (the shipped defaults, from
`components/design/feature-flags/design-flags-registry.ts`):

| Flag | Default | Effect |
|---|---|---|
| `useSimplifiedMatterIntake` | **on** (`:31`) | this flow renders at all |
| `useAiCaseIntake` | **off** (`:141`) | no Claude. Pure scripted state machine |
| `useEnterpriseAccount` | off (`:113`) | rotating lawyer carousel, not a pod |
| `useInPlatformEngagementLetter` | off (`:154`) | no signing wall first |

This matters more than anything else in the report: **by default there is no AI in
the AI intake.** Every "Claude will understand you" affordance in the copy is
inert unless someone flips a hidden dev flag. Findings are written against the
default; where the AI flag changes the answer, it is called out.

---

## 1. START

### What happens today

1. The route renders, the docked "Case brief" panel appears on the right, the
   chat column is empty (`use-intake-state.ts:107` starts from `EMPTY`).
2. `hydrated` flips, then the greeting effect (`conversational-intake-flow.tsx:140`)
   sets `thinking = true` and waits `THINKING_MS = 650` (`:47`).
3. For those 650ms the only thing on screen is a Moritz avatar and a spinner
   labelled **"Thinking…"** (`typing-indicator.tsx:21`).
4. `startIntake()` (`script.ts:151`) appends one message, which then reveals
   word-by-word through `StreamingText` at 34ms/word, capped at 1400ms
   (`streaming-text.tsx:15-16`).
5. The greeting (`script.ts:49-50`) reads: *"Hi — I'm Moritz. I'll walk through a
   few quick questions and build out a case brief on the right as we go. Voice and
   attachments are welcome whenever you'd like. / To start, what kind of matter is
   this? Pick one below, or describe it in your own words."*
6. Only **after** streaming finishes do the six matter chips appear — Contract,
   Employment, Procurement, Corporate, M&A, Something else (`intake-message.tsx:167`
   gates the card on `streamingDone`).
7. A chip click calls `sendUserMessage(chip.label)` (`:336`). Free text goes
   through `interpretAnswer` (`script.ts:102`), which matches the chip **label or
   value, lowercased, exact only** (`:110`).

### Problems a real user hits

- **The app is "Thinking…" before the user has said a word.** The first thing on
  screen is a spinner attributing thought to Moritz about nothing. `thinking` is
  set at `:149` before any message exists. It is a fake 650ms delay
  (`THINKING_MS`) with no work behind it.
- **The invitation to "describe it in your own words" is a trap by default.**
  With `useAiCaseIntake` off there is no classifier. `script.ts:243` checks
  `isMatterId(value)`, finds no `ai.classifiedMatterId`, and falls through to the
  re-ask at `:248`. So `"contract"` works and `"I have a contract dispute with my
  landlord"` is rejected. The one thing a distressed non-lawyer will actually type
  is the one thing that fails.
- **Rejection is an unbounded loop with no escape and no explanation.** The
  re-ask is *"Let's make sure I route this to the right team — which of these fits
  best?"* (`script.ts:250`). It never says why the answer failed, never says "type
  one of these words exactly", never degrades to "Something else" after N
  attempts, and never offers a human. A user can loop forever.
- **Nothing is explained up front.** No indication of: how many questions, how
  long it takes, whether this costs money, what happens after submitting, whether
  a lawyer sees it, whether it is confidential, whether it can be saved, or that
  legal advice is not being given. "A few quick questions" is the entire briefing.
- **The user cannot tell how long this will take, and the one progress signal
  actively lies.** Before a matter is picked, `orderedQuestions` returns a
  single-item list (`script.ts:68`), the lawyer step is suppressed
  (`intake-brief-panel.tsx:80`), so the panel renders the counter **"0 / 1"**
  (`:99-101`). The flow is actually six steps. The client is told it is one.
- **The counter can never be completed, by construction.** `lawyerStep` is added
  to the denominator (`intake-brief-panel.tsx:80-84`) but is only `complete` once
  `submitted` is true. So the maximum a client can see before submitting is 6/7.
- **"Voice … welcome whenever you'd like" is false.** The mic in the composer is
  a prototype that ignores the microphone and pastes a hardcoded string:
  `SAMPLE_TRANSCRIPT = "I'd like to understand my options before deciding how to
  proceed."` (`chat-composer.tsx:85-86`, inserted at `:188-196`). A client who
  speaks their situation gets someone else's sentence typed into their case.
- **Chips are unreachable for ~2s and unreachable by keyboard until then.** They
  mount only after streaming completes, so the fastest possible path to the first
  interaction is 650ms + up to 1400ms of animation.
- **Six abstract nouns with zero disambiguation.** "Procurement" vs "Contract" vs
  "Corporate" is a distinction a lawyer makes, not a client. No chip has a
  description, example, or tooltip. `MATTER_CHIPS` (`matters/index.ts:30`) carries
  label only.
- **Header says "New case" and nothing else.** `deriveTitle` returns the literal
  `'New case'` while `matterId` is undefined (`extract.ts:44`), in both the header
  and the panel title.

---

## 2. CONVERSATION

### What happens today

- Chat in a `max-w-3xl` centre column, panel docked at 360px on `md+`
  (`intake-chat-shell.tsx:38`, `:110`), a modal right-hand Drawer on mobile.
- Every matter has an identical shape: 3 questions (one free-text `situation`, one
  party name, one optional third) → shared `urgency` chips → `documents` →
  `recap`. See `matters/contract.ts`, `employment.ts`, `procurement.ts`,
  `corporate.ts`, `ma.ts`, `other.ts` — all three-question, all the same skeleton.
- Each user turn: append message, `setThinking(true)`, wait 650ms, run
  `stepIntake` synchronously, append the reply (`conversational-intake-flow.tsx:249-254`).
- The brief panel re-renders a vertical timeline of dots and labels
  (`intake-brief-panel.tsx:126-162`).

### Problems a real user hits

- **The "case brief" shows no case and no brief.** This is the single worst
  finding in the flow. `IntakeBriefPanel` receives `answers` and `files`
  (`:29-39`) and uses them for exactly one thing: a boolean `isFilled` check at
  `:45-49`. It then maps every row to `{ key, label, state }` (`:53-69`) and
  renders **only `step.label`** (`:156`). So the panel knows "the other side is
  Acme Corp" and displays the word **"Other side"** with a green tick. The header
  says "Case brief", the body promises *"I'll capture the details here as we
  chat"* (`:122`), and the details are never shown. It is a checklist wearing a
  brief's label. A client cannot verify a single thing they said.
- **The client cannot correct a wrong answer. There is no mechanism at all.**
  `useIntakeState` exposes `mergeAnswers` but nothing in the UI calls it for a
  past key. Panel rows are `<p>`, not buttons (`:148`). Past chips are hard-locked
  — `locked = !interactive || selectedChipValue !== undefined`
  (`intake-message.tsx:294`) with `interactive={isLast && !thinking}`
  (`conversational-intake-flow.tsx:554`). There is no edit, no back, no
  "actually, change that". A typo'd counterparty name is permanent for the life of
  the case; the only remedy is "Start over" and retyping everything.
- **Saying "no, I meant X" does not correct anything — it consumes the next
  question.** The engine unconditionally records whatever text arrives against
  `state.currentKey` (`script.ts:264`). So a correction is stored as the answer to
  the question that happens to be pending, and the real question for that slot is
  now answered wrong too. One correction corrupts two fields.
- **A wrong chip cannot be undone.** Selecting "Employment" when you meant
  "Contract" routes you into a three-question branch (`orderedQuestions`,
  `script.ts:70-76`) with no exit but Start over.
- **Off-script questions are not handled by default.** The `offScript` branch
  (`conversational-intake-flow.tsx:294-298`, `reaskWithNote` at `script.ts:304`)
  only ever fires when the AI flag is on. With it off, *"wait, how much does this
  cost?"* is silently recorded as the client's answer to "Who's on the other
  side?" and appears verbatim in the recap as their counterparty.
- **Every reply is padded with 650ms of fake latency,** then animated for up to
  1400ms more, with the answer chips withheld until the animation ends. Roughly
  2s of theatre per turn, six turns, on a form the user wants to get through.
- **The only thing shown while thinking is a spinner and the word "Thinking…".**
  No partial text, no skeleton, no indication of what it is doing or how long is
  left. A streaming route exists at `app/api/intake/route.ts` and is called by
  nothing (verified: zero importers). `/api/ai-intake` is a blocking
  request/response (`ai-intake-client.ts:21`).
- **Failure is indistinguishable from success.** `aiTurn` returns `null` on any
  error, non-200, or abort (`ai-intake-client.ts:33`); the route returns HTTP 200
  `{ ok: false }` for a missing API key (`app/api/ai-intake/route.ts:21-23`), bad
  JSON (`:29`), and any thrown error (`:42-44`). The client then quietly runs the
  scripted reply (`conversational-intake-flow.tsx:288-292`). **There is no error
  state in this flow.** No toast, no retry, no "I didn't catch that". The intake
  silently degrades to a dumber product and tells no one — not the user, not the
  developer.
- **"Stop" leaves a dangling turn.** `onStop` (`:404-414`) clears the timer,
  aborts the request, and sets `thinking = false`. The user's message is left on
  screen with no reply, no "stopped" marker, and no retry affordance
  (`:284-286` deliberately returns without touching the transcript). The only way
  forward is to send another message, which is then recorded against the same
  pending key.
- **The panel is a modal drawer on mobile.** `isMobile` renders a `Drawer` that
  defaults `open` (`intake-chat-shell.tsx:78-81`, `isPanelOpen` defaults `true` at
  `:68`) and dims the page. A phone client can be greeted by a full-screen
  overlay of step labels sitting on top of the conversation.
- **Silent transcript truncation.** `MAX_MESSAGES = 60` with `cap()` slicing from
  the front (`use-intake-state.ts:14`, `:97-98`). A long conversation loses its
  opening turns with no notice.
- **A resumed draft says nothing about being resumed.** `loadSnapshot` restores
  mid-conversation (`:58`), `initialCountRef` suppresses re-streaming
  (`conversational-intake-flow.tsx:143-145`), and the client is dropped into the
  middle of a chat with no "picking up where you left off" and no timestamp.
- **Timestamps are stored and never rendered.** Every message carries `createdAt`
  (`intake-types.ts:47`); neither `UserTurn` nor `AssistantTurn` displays it.

---

## 3. UPLOAD

### Every way a file can be attached

| Route | Where | Available when |
|---|---|---|
| Composer paperclip → native picker | `chat-composer.tsx:329-353` | every step **except** the documents step and the recap |
| Inline "Attach files" button | `intake-message.tsx:488-495` | documents step only |
| Drag-and-drop | `intake-message.tsx:388-394` | **onto the inline card only**, documents step only |
| Mic | — | prototype, inserts a fixed sentence |

### What happens today

- Paperclip files go to `pendingFiles` (`conversational-intake-flow.tsx:378-380`),
  dock as chips in the composer with `state: 'done'` hardcoded (`:389-401`), and
  commit to `files` when the next message sends (`:239-242`).
- Documents-step files go straight into `files` via `addFiles` (`:362-367`).
- Both paths funnel through `toIntakeFiles` (`file-utils.ts:24-30`), which keeps
  **`{ id, name, size }` and discards the `File` object.**

### Problems a real user hits

- **Drag-and-drop does not work anywhere on the page.** The only `onDrop` in the
  entire live flow is on the inline `AttachCard` div (`intake-message.tsx:394`).
  There is no page-level, column-level, or composer-level drop zone — verified by
  grep across `new-case/` and the live `intake/chat/` and `intake/components/`
  files. Drop a PDF on the chat column, the composer, or the brief panel and the
  browser does its default thing: **navigates away to the file.** Because
  `useUnsavedChangesGuard` is armed (`conversational-intake-flow.tsx:181`), the
  client gets a raw browser "Leave site?" dialog. The most natural upload gesture
  in the world is a data-loss event here.
- **The paperclip disappears at the exact moment the app asks for documents.**
  `footerHidden` includes `currentKey === DOCUMENTS_KEY` (`:525-528`), and the
  whole footer collapses to `max-h-0` (`:605`). Moritz says *"drop them in
  below"* (`matters/shared.ts:56`) at the one step where the thing below is gone.
  The client has spent five turns learning the paperclip; it is removed on cue.
- **"Drop them in below" also points the wrong way.** The dropzone is the card
  *above* the (now hidden) composer, not below anything.
- **The file is never read. Not once. Nowhere.** `toIntakeFiles`
  (`file-utils.ts:25-29`) maps to name and size. No `FileReader`, no
  `arrayBuffer()`, no base64, no `FormData`, no upload request — verified by grep
  across `new-case/`: zero matches. The `File` handle is garbage-collected at the
  end of the event handler. What persists to `localStorage` is a filename string.
- **An uploaded file affects the conversation in exactly zero ways.** Traced end
  to end:
  - It does **not** reach the model. The `AiTurnRequest` contract
    (`ai/types.ts:12-23`) has no file field. `runTurn`'s prompt is built from
    `transcript`, `answers`, and `userMessage` only
    (`ai/anthropic-intake.ts:249-255`). Same for `runRecap` (`:307-338`).
  - It does **not** change any question. `orderedQuestions` is a static
    concatenation of the matter's fixed list (`script.ts:64-78`). No branch, no
    predicate, no question is added, removed, or reworded because a file exists.
  - It does **not** pre-fill any answer. `extracted` comes only from the model's
    reading of the user's *typed text* (`sanitizeExtracted`, `:173`).
  - An extraction endpoint that *does* accept PDF document blocks exists at
    `app/api/extract/route.ts` — and **nothing calls it.** Verified: zero
    importers, zero fetches to `/api/extract` anywhere in `app/`, `components/`,
    or `lib/`.
  - Its total observable effect: a filename chip on the bubble
    (`intake-message.tsx:73-97`), a green tick on the "Documents" panel row
    (`intake-brief-panel.tsx:46`), and the string `"3 files"` on the recap
    (`intake-message.tsx:630-632`).

  **Plainly: uploading a document is a no-op with a progress tick.** A client can
  attach a 40-page contract that answers every remaining question, and Moritz will
  proceed to ask all of them anyway, having never opened it. This is the single
  most misleading thing the product does — the flow explicitly asks for
  "Contracts, letters, term sheets, or prior drafts" (`matters/shared.ts:56`) as
  though they will be read.
- **The client is told nothing after a file lands.** No "received", no size, no
  type, no page count, no preview, no "I've read this", no "we'll review this".
  The composer chip shows an icon and a truncated filename
  (`chat-composer.tsx:264-271`); `meta` is never populated by this flow, so even
  the size is hidden — despite `formatFileSize` existing at `file-utils.ts:32`
  and being called nowhere.
- **No validation of any kind.** No size cap, no count cap, no MIME or extension
  allowlist, no duplicate detection, no empty-file check. `<input type="file"
  multiple>` with no `accept` (`intake-message.tsx:508-514`,
  `chat-composer.tsx:346-352`). A client can attach a 2GB video and 300 files.
  The 300 files then render as chips until `MAX_VISIBLE = 8` truncates the bubble
  (`intake-message.tsx:66-68`) — but the AttachCard has no cap and renders all of
  them.
- **The upload states that were built are never used.** `ComposerAttachment.state`
  supports `'uploading' | 'processing' | 'error'` with a spinner
  (`chat-composer.tsx:47`, `:239-262`); the flow hardcodes `state: 'done'`
  (`conversational-intake-flow.tsx:398`). There is no failure path because there
  is no upload.
- **Removing a file leaves it visibly attached.** `removeFile` filters `files`
  (`:369-374`) but `message.attachments` is an independent copy taken at send time
  (`:236`). The chip stays on the bubble forever, contradicting the panel and the
  recap count.
- **`localStorage` persists filenames that resolve to nothing.** After a refresh,
  `files` rehydrates (`use-intake-state.ts:84`) and the recap confidently reports
  "3 files" for three files that exist nowhere.
- **Attaching without text produces a robotic turn.** An attachments-only send
  synthesises the engine text `"2 files attached"`
  (`conversational-intake-flow.tsx:227-228`), which is recorded as the client's
  answer to whatever question is pending. Attach a contract while Moritz is
  asking "Who's on the other side?" and the counterparty becomes the literal
  string `"1 file attached"` — which then flows into the case title via
  `PARTY_KEY_BY_MATTER` (`extract.ts:19-26`), producing a case named
  **"1 file attached Contract"**.

---

## 4. REVIEW AND SUBMIT

### What happens today

- Reaching the recap sets `done` and emits a `recap` card (`script.ts:278-279`).
  Copy: *"Here's what I've got. Have a look and submit whenever you're ready."*
  (`matters/shared.ts:63-64`).
- `RecapCard` (`intake-message.tsx:543`) renders an inline-editable case title, one
  row per answered question, a "Files: N files" row, and a two-button footer:
  "Keep editing" (outline) / "Submit case" (primary).
- The composer is hidden (`footerHidden`, `conversational-intake-flow.tsx:525-528`)
  until "Keep editing" sets `refining` (`:564`).
- Submit (`:463-513`): guard, `setSubmitting(true)`, derive the title, **900ms
  `setTimeout`**, record the title to `localStorage`, mutate the recap message in
  place into a `submitted` card with a fresh id so it re-animates, fire a toast.

### Problems a real user hits

- **Nothing says this is the last step.** No "Step 6 of 6", no "Almost done", no
  "Review". The signals are a card appearing and the composer silently vanishing —
  which reads as breakage, not completion. Meanwhile the panel counter says
  **5/7 or 6/7**, never complete (see §1).
- **The panel contradicts the recap at the finish line.** `questionsComplete`
  requires *every* row complete including Documents, which is only complete if
  `files.length > 0` (`intake-brief-panel.tsx:46`, `:87-89`). A client who skips
  documents — which the copy invites — sees the panel say *"Filling this in as we
  talk."* (`:121`) while the recap says it has everything and invites submission.
- **The recap omits everything the client skipped, silently.** Rows with `null` or
  `'Skipped'` are filtered out entirely (`intake-message.tsx:576`). A client cannot
  see what was left blank, cannot tell the difference between "not asked" and "not
  answered", and gets no chance to fill a gap before it reaches a lawyer.
- **The recap omits the filenames.** Just `"{n} file{s}"` (`:630-632`). After
  attaching four documents across a long conversation, the client cannot confirm
  *which* four are going with the case.
- **Answers cannot be edited from the recap. The button that implies otherwise
  does something else.** "Keep editing" only flips `refining` to reveal the
  composer (`:564`). Then:
  - Typed text is recorded against `currentKey`, which is now `RECAP_KEY`
    (`script.ts:264`), i.e. stored under the key `'recap'`.
  - The recap row builder filters `RECAP_KEY` out (`intake-message.tsx:567`), and
    so does the brief panel (`intake-brief-panel.tsx:42`).
  - **So the text the client typed to fix their case is written to a key that no
    surface displays and no consumer reads.** It vanishes. The only trace is their
    own chat bubble.
  - `pendingQuestions` now finds nothing pending, so `next` falls back to
    `RECAP_QUESTION` (`script.ts:278`) and Moritz replies with the *identical*
    sentence and a **second recap card**, identical to the first.
- **Two live recap cards, and the stale one is not disabled.** `RecapCard` takes
  `interactive` and uses it for the title field only (`:587`). Neither footer
  button is gated on it: "Keep editing" is `disabled={submitting}` (`:647`) and
  "Submit case" has no `disabled` at all (`:651-658`). So the old card's primary
  CTA looks fully live.
- **Submitting mutates the wrong card, putting the confirmation above the recap.**
  `onSubmitCase` takes `messages.find(m => m.card?.type === 'recap')`
  (`:479`) — the **first**. With two recaps it transforms the older, higher one
  into the confirmation and leaves the newer recap card sitting **below** the
  "Case submitted" card, still offering "Submit case". Clicking it hits the
  `if (submitting || submitted) return` guard (`:464`) and **does nothing, with no
  feedback whatsoever.** A primary button, after submission, that silently no-ops.
- **The auto-derived title is unexplained and frequently wrong.**
  `deriveTitle` glues the counterparty answer to the matter label
  (`extract.ts:40-50`), so a client who answered "not sure yet, maybe a company in
  Berlin" gets the case *"not sure yet, maybe a company in Berlin Contract"*
  (truncated at 48 chars, `:32`). It is editable, but nothing says it is editable
  or that it is a guess — `InlineField` (`:587-596`) is styled as a plain heading.
- **With the AI flag on, the title changes under the client's cursor.**
  `enrichRecap` (`:203-214`) fires a second, unindicated Anthropic call after the
  recap renders and calls `setTitleOverride` on arrival (`:208`). No spinner, no
  "suggesting a name". Rows can change too, since `summaries` replace the raw
  answers (`intake-message.tsx:570-574`). The client re-reads a card that rewrote
  itself mid-read.
- **The one-line synopsis that was written for this card is dead code.**
  `deriveSynopsis` (`extract.ts:93-109`) has zero callers. The recap shows no
  summary of the matter at all — only disconnected field rows.
- **The AI-written lawyer brief is computed and thrown away.** `onSubmitCase`
  builds `description` from `aiDescriptionRef ?? deriveDescription(...)` and the
  very next statement is **`void description;`** (`:473-475`). The work Claude did
  in `runRecap` to write a 2–3 sentence brief for the assigned lawyer is
  discarded on the floor.
- **Submission is 900ms of theatre and has no failure mode.** A bare
  `setTimeout(..., 900)` (`:472`, `:503`) with no network call. Consequences: the
  submit button can never show a real error, there is no retry, no idempotency,
  and the "Submitting…" state (`:657`) is a fixed animation rather than a status.
  A client on a dead connection gets a full success confirmation.
- **Feedback in the seconds after clicking is duplicated and then contradicted.**
  A `isPending` spinner + "Submitting…" on the button, then simultaneously a
  sonner toast *"Case submitted — \"X\" is on its way to the team."* (`:498-500`)
  **and** an in-chat card that re-streams the same news (`:477`). Two
  notifications for one event, and the toast's "on its way to the team" conflicts
  with the card's "nobody is assigned until you pay" (see §5).
- **No confirmation step, no consent, no summary of consequences.** One click on a
  primary button sends a legal matter to a law firm. No "are you sure", no "by
  submitting you agree…", no note about what the firm will do with the attachments.

---

## 5. SUBMITTED

### What happens today

`CaseSubmittedCard` (`case-submitted-card.tsx:57`) renders, in order: a
circle-check with an `mz-animate-draw` stroke animation, the words **"Case
submitted"**, a lawyer section, a two-row description list, and two buttons.

- Standard accounts get `StandardShowcase` (`:252`) — eyebrow *"Lawyers who could
  take this on"*, a 3-column grid of headshots where each cell cross-fades through
  a different subset of the roster every 5s with a 700ms fade and 700ms per-cell
  stagger (`:232-235`, `:306-321`).
- `Estimated response: {turnaround}` from `estimateTurnaround` (`extract.ts:115`).
- `Next step:` *"We'll prepare your quote. Once it's paid, we'll assign one of our
  lawyers."*
- Buttons: "Start another case" (outline) and "Go to case" (primary).
- The streamed sentence above the card: *"You're all set — I've opened {title} and
  the team has been notified. Here's what happens next."* (`:477`).

### Problems a real user hits

- **"Go to case" goes to a different case.** `NEW_CASE_HREF` is computed **once at
  module load** from mock fixtures — the most recent pre-existing case of the mock
  company (`case-submitted-card.tsx:37-43`). The primary CTA on the confirmation
  screen sends the client to an unrelated case they did not create. The case they
  just submitted has no id, no route, and no detail page.
- **The case they just created is destroyed the moment they leave.** `loadSnapshot`
  detects a `submitted` card and **deletes the snapshot**
  (`use-intake-state.ts:69-72`). The only thing that survives is the title string
  in `playground:new-case-created-titles:v1` (`created-cases.ts:24`), kept purely
  for de-duplicating future names. Navigate away and the entire submission —
  answers, filenames, confirmation — is unrecoverable. There is no record anywhere
  that the client can return to. This is the most consequential defect in the flow.
- **The card never names the case.** It says "Case submitted" and nothing else
  (`:83`). The title appears only in the streamed sentence above and in a toast
  that auto-dismisses. No case number, no reference, no id, no date.
- **The quote is one subordinate clause and every operative detail is missing.**
  *"We'll prepare your quote. Once it's paid, we'll assign one of our lawyers."*
  No amount, no range, no order of magnitude, no when it arrives, no how it
  arrives (email? in-app? phone?), no who to ask, no what happens if they decline,
  no whether anything is chargeable already. A first-time client cannot answer
  "have I just agreed to spend money?"
- **Cost is never mentioned anywhere in the entire flow.** Grepped: the only
  pricing-adjacent string in `new-case/` is that one sentence. No fee basis, no
  hourly rate, no "free until you approve a quote", no consultation fee. Six
  questions and a document upload to a law firm with zero cost disclosure.
- **The "Estimated response" is the client's own answer handed back as a firm
  commitment.** `estimateTurnaround` is a pure switch on the urgency chip the
  client picked (`extract.ts:115-126`): "Today" → "2–4 hours". The firm has
  promised nothing; the client sees a service-level commitment. `default` silently
  returns "12–24 hours" for an unanswered urgency (`:124`) — a promise invented
  out of a missing answer.
- **The card contradicts itself about whether anyone has looked at this.** The
  streamed sentence says *"the team has been notified"* (`:477`) while the Next
  step says nobody is assigned until a quote is paid (`:105`). The eyebrow says
  *"Lawyers who could take this on"* — a carousel of people who explicitly have
  not been assigned. The client is shown five faces and told that none of them are
  theirs.
- **The rotating headshot carousel is the wrong instrument.** Motion is the most
  salient thing on a confirmation screen — a 15-person slideshow drawing the eye
  away from the only two facts that matter (when, and what it costs), which sit
  below it in small muted `DescriptionList` type. It is marketing furniture on a
  receipt.
- **There is no next step for the client.** Both listed "next steps" are things
  the firm will do. No "we've emailed you a copy", no "add anything you forgot",
  no "contact us", no expectations for what to do if nothing happens. Nothing is
  actionable.
- **What is left unexplained:** the case id and where to find it; whether a
  confirmation email exists; whether the documents were received or read; who can
  see the submission; whether it is confidential or privileged; what the quote will
  cost; whether it is binding; how to cancel or withdraw; how to add information;
  what happens if the quote is declined; whether the urgency they picked actually
  changed anything.
- **"Start another case" wipes state with no confirmation.** `onRestart` →
  `hasActiveIntake` is still true → the leave dialog opens
  (`conversational-intake-flow.tsx:429-435`) offering **"Delete case"** and
  **"Save as draft"** (`leave-intake-dialog.tsx:69-77`) for a case that was just
  submitted. Both options are nonsense in this context, and "Save as draft" only
  fires a toast claiming *"Your in-progress case stays here on this device"*
  (`:445-447`) — which is false, since the submitted snapshot is purged on next
  load.

---

## A. DEAD ENDS

Ordered by severity. Every one is reachable in the default configuration unless noted.

1. **Submitted case is permanently destroyed on navigation.**
   `use-intake-state.ts:69-72` removes the snapshot. No backend
   (`conversational-intake-flow.tsx:472` is a `setTimeout`). The client's case
   ceases to exist and they have no way to know that.
2. **"Go to case" lands on someone else's case.** `case-submitted-card.tsx:37-43`
   resolves a mock fixture at module load. The primary CTA of the whole flow is
   wrong.
3. **Free-text matter type → infinite re-ask loop** (`script.ts:243-257`). No
   escalation, no explanation, no human fallback, no hint that exact chip wording
   is required — while the greeting explicitly invited free text.
4. **"Keep editing" text is written to a key nothing reads** (`'recap'`, filtered
   out at `intake-message.tsx:567` and `intake-brief-panel.tsx:42`). Silent data
   loss on the one screen designed for corrections.
5. **A live-looking "Submit case" button that silently does nothing.** The stale
   second recap card after Keep-editing → Submit (`intake-message.tsx:651-658`
   has no `disabled`; the guard at `conversational-intake-flow.tsx:464` returns
   without feedback).
6. **Confirmation renders above a leftover recap card**, because submit mutates
   the *first* recap found (`:479`).
7. **No way to correct any answer, ever** — no edit affordance anywhere, past
   chips hard-locked (`intake-message.tsx:294`), corrections consume the next
   question (`script.ts:264`).
8. **Drag-and-drop anywhere except one card navigates the browser away from the
   intake**, triggering a raw "Leave site?" prompt. Only `onDrop` is
   `intake-message.tsx:394`.
9. **The paperclip is removed at the documents step** (`footerHidden`,
   `conversational-intake-flow.tsx:525-528`) while the copy says "drop them in
   below". If the inline card is missed, there is no way to attach anything.
10. **Uploads fail silently by design** — files are never read, never uploaded,
    never sent to the model (`file-utils.ts:24-30`; no file field in
    `ai/types.ts:12-23`). Maximum-confidence UI (green tick, filename chip, "N
    files") over a total no-op.
11. **`/api/ai-intake` reports every failure as HTTP 200 `{ok:false}`**
    (missing key `:21`, bad body `:29`, thrown error `:42`), the client maps all
    of it to `null` (`ai-intake-client.ts:33`), and the flow degrades with **no
    user-visible error state anywhere in the intake.** There is no error UI to
    audit, because none exists.
12. **"Stop" abandons the turn** with no reply, no marker, no retry
    (`conversational-intake-flow.tsx:284-286`).
13. **Off-script questions are recorded as answers** when the AI flag is off
    (`script.ts:264`) — asking about cost overwrites the counterparty field.
14. **`0 / 1` progress before the matter pick** (`intake-brief-panel.tsx:99`) and
    a counter that can never reach complete (`:80-84`).
15. **Panel says "Filling this in as we talk" while the recap says it has
    everything** (`:87-89` requires files to exist).
16. **"Case brief" empty state promises details that are never rendered**
    (`:122` vs `:156`).
17. **Attachments-only send poisons the pending answer** —
    `"1 file attached"` becomes the counterparty and then the case title
    (`conversational-intake-flow.tsx:227-228` → `extract.ts:47`).
18. **Removed files stay visible on their bubble** forever (`:236` vs `:369`).
19. **Mic pastes a hardcoded stranger's sentence** into the client's case
    (`chat-composer.tsx:85-86`).
20. **Silent transcript truncation at 60 messages** (`use-intake-state.ts:97`).
21. **All `localStorage` failures swallowed** (`:124-126`, `:92-94`,
    `created-cases.ts:29-31`) — private browsing loses the draft with no notice,
    and the "Saved as draft" toast (`conversational-intake-flow.tsx:445`) lies.
22. **Resumed drafts give no orientation** — no "resumed", no timestamp
    (`:143-145`).
23. **Mobile opens onto a modal, dimmed drawer** covering the chat
    (`intake-chat-shell.tsx:78-81` with `isPanelOpen` defaulting true).
24. **Skipped answers disappear from the recap** with no "not provided" row
    (`intake-message.tsx:576`).
25. **No file validation of any kind** — no size, count, or type limits
    (`intake-message.tsx:508-514`, `chat-composer.tsx:346-352`).

---

## B. LATENCY

Every wait in the flow, and what the client sees during it.

| # | Wait | Duration | What the user sees | Verdict |
|---|---|---|---|---|
| 1 | Hydration before first paint of any message | 1 render tick | Empty chat column, docked panel showing **"0 / 1"** | No skeleton; a legal intake that looks empty/broken on arrival |
| 2 | `THINKING_MS` before the greeting (`:149-158`) | **650ms fixed** | Spinner + **"Thinking…"**, with nothing to think about | **Fabricated.** Attributes thought to the app before the user has spoken |
| 3 | Greeting word-by-word reveal (`streaming-text.tsx:15-16`) | up to **1400ms** | Text appearing; **chips do not exist yet** (`intake-message.tsx:167`) | Handled but unskippable. ~2s to first possible interaction |
| 4 | `THINKING_MS` on every scripted turn (`:249-253`) | **650ms × 6 turns** | "Thinking…" | **Fabricated.** ~4s of invented latency per intake |
| 5 | Each reply's stream + gated card | up to 1400ms × 6 | Text, then chips/dropzone appear late | Answer controls withheld until the animation finishes |
| 6 | **AI turn round-trip** (flag on, `:269-279`) | **up to 12,000ms** (`AI_TIMEOUT_MS`, `:50`) | **"Thinking…" and nothing else, for twelve seconds** | **Unhandled.** No progressive text, no elapsed time, no "still working", no escalating copy. A streaming route exists (`app/api/intake/route.ts`) and is called by nothing. Effectively a freeze |
| 7 | Timeout → scripted fallback (`:288-292`) | silent | A generic scripted reply, indistinguishable from a real one | **Unhandled.** The user is never told the smart path failed |
| 8 | **`enrichRecap` second AI call** (`:203-214`, `:317`) | unbounded — **no timeout, no abort signal passed** | **Nothing at all.** No spinner. Then the title and row values mutate under the cursor | **Unhandled and the worst-behaved wait.** Fires after the card is already interactive; the client is editing a title that rewrites itself. `aiRecap` accepts a `signal` (`ai-intake-client.ts:40`) and the caller never passes one — so it also survives "Start over" |
| 9 | Submission (`:472-503`) | **900ms fixed** | "Submitting…" + `isPending` spinner | Handled, but fake. No network call, therefore **no failure state can ever exist** |
| 10 | Submitted card re-stream (`:484-487`, new id forces remount) | up to 1400ms | Confirmation text typing itself out | The client waits to be told their legal matter was received |
| 11 | Remote headshot images (`:346-351`, `:156-159`) | network, unbounded | `AvatarFallback` initials, then a pop-in | No skeleton, no `loading`/size hints; layout pops on the confirmation |
| 12 | Confirmation carousel (`:233-235`, `:306-321`) | 5s loop, 700ms fades, forever | Faces cross-fading indefinitely | Not a wait — perpetual motion competing with the only two facts on the card. `prefers-reduced-motion` is respected (`:263-269`) |
| 13 | Snapshot persistence debounce (`use-intake-state.ts:13`, `:118-131`) | 300ms | Nothing | Closing the tab inside the window loses the last turn, silently |

**Net fabricated latency in the default path: ~4s of `THINKING_MS` + ~8s of
streaming + 900ms of fake submit ≈ 13 seconds of deliberate delay** in a flow
whose only real work is a `switch` statement. With the AI flag on, add up to 12s
of unnarrated blocking wait per turn.

---

## C. GAPS AGAINST THE COMPLAINTS

### "People do not know when a case is submitted"

Cause: **the confirmation is a chat message, and it is the only record that ever
exists.**

- The confirmation is not a page, route, or state — it is a mutated transcript
  entry (`conversational-intake-flow.tsx:479-487`). It has no URL, cannot be
  bookmarked, cannot be reloaded, cannot be shared, cannot be found again.
- `use-intake-state.ts:69-72` **deletes the snapshot** the next time
  `/client/new` loads. The submission is then gone with no trace but a title
  string kept for name de-duplication (`created-cases.ts:24`).
- `onSubmitCase` performs **no network call** (`:472` `setTimeout`) — nothing is
  recorded anywhere, so there is nothing to go back to and no email to receive.
- The card never states the case name (`case-submitted-card.tsx:83` says only
  "Case submitted"); the name appears in a streamed sentence and an
  auto-dismissing toast (`:477`, `:498`).
- No case id, reference number, or timestamp is generated anywhere in the flow.
- **"Go to case" resolves to an unrelated fixture** (`case-submitted-card.tsx:37-43`),
  so the one link that should prove submission disproves it.
- Two conflicting statements at the moment of truth: *"the team has been
  notified"* (`:477`) vs *"Once it's paid, we'll assign one of our lawyers"*
  (`:105`). The client cannot tell whether anything happened.
- Before submitting, the end is equally unmarked: no "last step", and the panel
  reads 5/7 or 6/7 by construction (`intake-brief-panel.tsx:80-84`).

### "People do not know the steps"

Cause: **the only progress surface renders labels without values and starts by
claiming there is one step.**

- `IntakeBriefPanel` receives `answers` and `files`, uses them solely for a
  boolean (`:45-49`), and renders **only `step.label`** (`:156`). It is a
  checklist of abstract nouns — "What you need", "Other side", "Timeline" —
  labelled "Case brief".
- Before the matter pick, `orderedQuestions` knows only one question
  (`script.ts:64-68`) and the lawyer step is withheld (`:80-82`), so the counter
  reads **"0 / 1"** (`:99-101`) for a six-step flow. The client's first
  impression of length is off by 6×.
- The denominator includes a step the client cannot complete (`lawyerStep`,
  `:74-84`), so the bar never fills.
- Panel copy promises what it does not deliver: *"I'll capture the details here as
  we chat"* (`:122`).
- Steps are `<p>` elements (`:148`) — not navigable, not clickable, not editable.
  Nothing in the panel can be acted on.
- Copy in the flow gives no numbering, no duration, no map. `MATTER_TYPE_QUESTION`
  says only "a few quick questions" (`script.ts:50`).
- The end of the flow is signalled by the composer *disappearing*
  (`:525-528`) — an absence, not an instruction.
- Panel and recap disagree at the finish (`:87-89` vs `matters/shared.ts:63`).
- On mobile, the step list is a modal drawer over the chat
  (`intake-chat-shell.tsx:78-81`).

### "Some cannot work out how to upload"

Cause: **the upload affordance moves, then disappears at the exact step that asks
for it, and the natural gesture breaks the page.**

- **Drag-and-drop works on one card and nowhere else.** The only `onDrop` in the
  live flow is `intake-message.tsx:394`. Dropping on the chat column, the
  composer, or the panel makes the browser navigate away — and since the unsaved
  guard is armed (`:181`), the client gets a raw browser dialog.
- **The paperclip is removed at the documents step.** `footerHidden` includes
  `currentKey === DOCUMENTS_KEY` (`:525-528`); the footer collapses to `max-h-0`
  (`:605`). The control the client spent five turns learning vanishes precisely
  when documents are requested.
- **The copy points at the thing that just disappeared:** *"drop them in below"*
  (`matters/shared.ts:56`) — the dropzone is above, and "below" is now empty.
- **Two unrelated mental models.** Composer files queue in `pendingFiles` and only
  commit when a message is sent (`:378-380`, `:239-242`); inline-card files commit
  immediately (`:362-367`). Same paperclip icon, different semantics, no
  explanation.
- **The dropzone is visually a card, not a target.** `AttachCard`'s resting state
  is a solid-bordered card (`intake-message.tsx:396`); the dashed "droppable"
  border appears **only mid-drag** (`:397-399`). At rest, nothing says "you can
  drop here" except the words inside it.
- **No acknowledgement after a drop.** No size, no type, no "received", no
  progress — `state: 'done'` is hardcoded (`:398`), `formatFileSize` is never
  called, and the built `uploading`/`processing`/`error` states
  (`chat-composer.tsx:47`) are unused.
- **And when they do work it out, it does nothing** (§3): bytes are discarded at
  `file-utils.ts:25-29`, no file field exists in `ai/types.ts:12-23`, no question
  changes, and the PDF-capable `app/api/extract/route.ts` has zero callers. The
  clients who *did* figure out uploading were never rewarded, which is its own
  reason the feature reads as broken.
- **Voice has the same shape of problem**: offered in the greeting
  (`script.ts:50`), and the mic pastes a fixed sentence
  (`chat-composer.tsx:85-86`, `:188-196`).

### "The whole thing feels sterile"

Cause: **the warmth is all motion and no substance — six identical fill-in-the-blank
turns that never demonstrate listening.**

- **Nothing the client says is ever reflected back.** With `useAiCaseIntake` off
  (the default, `design-flags-registry.ts:141`), `acknowledgement` is always
  absent, so every transition is a hardcoded string. Each matter has exactly one:
  *"Got it — a contract matter. Tell me a bit more…"* (`matters/contract.ts:13-14`).
  A client describing a redundancy dispute and a client describing an NDA renewal
  receive byte-identical replies.
- **Every matter is the same interrogation in different words.** All six flows are
  `situation` → party name → one optional field → urgency → documents
  (`matters/*.ts`, verified across all six). No branching, no follow-ups, no
  depth, no adaptation. `orderedQuestions` is a static concatenation
  (`script.ts:64-78`).
- **Empathy is impossible by construction.** The engine records
  `{ [question.key]: value }` and emits the next prompt (`script.ts:264-292`).
  There is no path for the assistant to respond to *content* — only to advance.
- **The one screen that could show listening shows labels instead.** The "Case
  brief" renders `step.label`, never the client's words
  (`intake-brief-panel.tsx:156`). The client watches ticks accumulate next to
  nouns. This is the sterility, concretely: a form that says it is a conversation.
- **Off-script humanity is punished.** Any question or aside is recorded as an
  answer (`script.ts:264`) and turns up verbatim in the recap as a field value.
  The `reaskWithNote` path that would handle it (`:304`) is AI-gated.
- **Warmth is simulated with delay.** `THINKING_MS = 650` (`:47`) and word-by-word
  reveal (`streaming-text.tsx`) imitate a person thinking, while nothing is
  thought. Fake tells are colder than plain speed — and the very first thing the
  client sees is "Thinking…" about nothing (`:149`).
- **The assistant is a logo.** `MoritzAvatar` renders the company symbol
  (`moritz-avatar.tsx:16-20`); the label is the brand name. Moritz is a brand
  mark, not a presence.
- **No human is ever mentioned until after submission,** and then only as a
  carousel of people explicitly *not* assigned — eyebrow *"Lawyers who could take
  this on"* (`case-submitted-card.tsx:275`), rotating every 5s (`:233`).
- **Zero acknowledgement of stakes.** No reassurance, no confidentiality note, no
  "this sounds stressful", no cost transparency, no "you can stop and come back".
  The urgency question's rationale is administrative: *"This helps us route urgent
  matters to the right lawyer faster"* (`matters/shared.ts:40`).
- **The vocabulary is the firm's, not the client's.** "Procurement", "Corporate",
  "M&A", "Counterparty & size" (`matters/ma.ts:27`), "Entity"
  (`matters/corporate.ts:27`) — six unexplained terms of art as the first
  interaction.
- **Two of the three warm touches that were built are dead code:**
  `deriveSynopsis` (`extract.ts:93`) has no callers, and the AI-written lawyer
  brief is discarded by `void description;` (`conversational-intake-flow.tsx:475`).

---

## Cross-cutting notes

- **The default configuration is the worst configuration.** `useAiCaseIntake`
  defaults to `false` (`design-flags-registry.ts:141`), so free-text routing,
  off-script answers, acknowledgements, AI titles, and recap summaries are all
  off out of the box. The product is named for a capability it ships disabled.
- **Three Anthropic surfaces exist; the flow uses one.** `/api/ai-intake` is wired
  (behind the off-by-default flag). `/api/intake` (SSE streaming) and
  `/api/extract` (structured extraction with PDF document blocks) have **zero
  callers** — verified across `app/`, `components/`, and `lib/`. The streaming
  route would fix latency finding #6; the extract route would fix the entire
  upload no-op in §3. Both are built and unplugged.
- **No submission backend exists.** `onSubmitCase` is a `setTimeout`
  (`conversational-intake-flow.tsx:472`). Every "your case has been submitted"
  claim in the UI is unbacked, which is the root cause of the first complaint.
- **Dead or discarded code found while tracing:** `deriveSynopsis`
  (`extract.ts:93`, no callers); `formatFileSize` (`file-utils.ts:32`, no
  callers); `void description` (`conversational-intake-flow.tsx:475`);
  `AssistantTurn`'s `onStreamTick` prop (`intake-message.tsx:143`, never passed);
  `ComposerAttachment`'s `uploading`/`processing`/`error` states and `previewUrl`
  and `meta` fields (`chat-composer.tsx:39-47`, never used by this flow);
  `aiRecap`'s `signal` parameter (`ai-intake-client.ts:40`, never passed).
