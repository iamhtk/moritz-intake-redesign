# Audit v2 — UI traps to avoid in the rebuild

**11 September 2026**

Read-only. No application code was changed for this report.

---

## How to read this

This is not a list of what is wrong with the current intake flow. It is a list of the
mistakes you are **most likely to repeat**, because they live inside the components and
idioms you will reuse when you "keep the visual language."

Every item is tagged:

- **`component`** — baked into a component the rebuild will import. You inherit it by
  default, silently, without writing the bug yourself.
- **`flow`** — a choice made in `new-case/` wiring. The rebuild simply does not repeat
  it, as long as you know it was a choice.
- **`both`** — a component weakness that the flow's wiring makes worse.

Findings were produced by eight parallel dimension audits, then each claim was
re-read by an adversarial verifier whose job was to refute it. Nothing here was
accepted on trust; where the first pass was wrong, the corrected version is what
appears below, and a few notable corrections are flagged inline. There is a
**[Checked and *not* a problem](#checked-and-not-a-problem)** section at the end —
read it, it will save you from "fixing" three things that are already right.

---

## Read this before section 1: the root cause

Most of what follows is one structural fact wearing eight different hats.

**There are two parallel component libraries in this repo, and the intake flow is
built on the wrong one.**

`components/design/foundations/components/` holds 37 files. 35 of them share a name
with a file in `packages/ui/src/components/`. **34 of those 35 differ byte-for-byte.**
Only `button.tsx` is identical (and `design/design-system/button.tsx` is a 10-line
re-export shim of the fork).

The live flow's imports: **17× from the fork layer, 1× from `@repo/ui`**
(`Badge`, `intake-message.tsx:31`), and 1× from the app-local shadcn copy
(`@/components/ui/sheet`, `intake-chat-shell.tsx:12`).

The drift runs **both ways**, so there is no superset to migrate to:

| Component | Ahead | Detail |
|---|---|---|
| `message-scroller` | `@repo/ui` (170 vs 159 lines) | fork dropped `useScrollActivity`, `mz-scrollbar-on-scroll`, the `label` prop |
| `chat-composer` | `@repo/ui` | fork dropped **all** file-drop handling |
| `attachment` | `@repo/ui` (342 vs 309) | fork dropped `AttachmentMedia`'s `icon`/`downloadable` props, the `SWAP_GLYPH` constant, and its `motion-reduce:transition-none` |
| `tabs` | `@repo/ui` (410 vs 290) | |
| `drawer` | **fork** (171 vs 135) | fork has the foundation surface treatment; `@repo/ui`'s is still stock shadcn `bg-black/50` |
| `dialog` | **fork** (212 vs 165) | |
| `table` | **fork** (232 vs 116) | |
| `input-otp` | **fork** (168 vs 77) | |

The docblocks confirm a half-finished promotion: forks say
`TODO(@repo/ui): fold this primitive into packages/ui during productionisation`,
while the `@repo/ui` twins say `Promoted from the design playground's foundation X`.

**Decide your base layer before you write a line, and write the decision down.**
Recommended: build on `@repo/ui` (it is the transpiled workspace package and the only
workspace with a `test` script), and treat Drawer/Dialog/Table as explicit back-ports —
copy the fork's surface treatment *into* `packages/ui` rather than importing the fork.

One concrete failure mode if you mix them: `foundations/attachment.tsx` imports
`./button` while `packages/ui/src/components/attachment.tsx` imports
`@repo/ui/components/button`. Import Attachment from both layers in one screen and a
single file card ends up with two Button implementations and two focus treatments.

Do not delete `design/foundations` — the `/foundations` showcase routes render it.
Just stop importing it from the new flow.

---

## 1. Scrolling

### Where a visible scrollbar appears

Five scroll containers. Four render a raw, untreated native scrollbar:

| # | Container | Where | Source |
|---|---|---|---|
| 1 | Transcript viewport | `foundations/components/message-scroller.tsx:75` | **shared component (fork)** |
| 2 | Docked panel body | `intake-chat-shell.tsx:140` **and** `:175` (copy-pasted) | **shared component** |
| 3 | Composer textarea (past 6 lines) | `design/intake/chat/chat-composer.tsx:309` | **shared component (fork)** |
| 4 | RecapCard `<dl>` | `intake-message.tsx:604` | **this flow** |
| 5 | Dashboard `main` | `dashboard-shell.tsx:57` — `flex-1 overflow-y-auto px-4 pb-10 pt-6` | **app layout** (latent double scrollbar under the `h-full` chain) |

So: **three of the four are coming from shared components, not from your flow.** You
inherit them by importing.

### The key asymmetry

`packages/ui` already solved this. Side by side, same component name:

```
packages/ui/src/components/message-scroller.tsx:68,73,80-81
  const markScrolling = useScrollActivity();
  onScroll={(event) => { markScrolling(event); onScroll?.(event); }}
  'focus-visible:ring-ring/50 min-h-0 flex-1 overflow-y-auto overscroll-contain …'
  'mz-scrollbar-on-scroll'          ← the treatment

apps/…/components/design/foundations/components/message-scroller.tsx:67,75
  (no useScrollActivity, no onScroll — just {...props})
  'focus-visible:ring-ring/50 min-h-0 flex-1 overflow-y-auto overscroll-contain …'
  (nothing)                          ← the fork dropped it
```

Identical class string minus one utility. Same story on the composer textarea:
`packages/ui/src/components/chat-composer.tsx:544,554` has `mz-scrollbar-on-scroll`
and calls `markScrolling(event)` before `updateFades()`; the fork at `:305,:309` has
neither, and carries this comment only in the library version:

> *The input grows to a cap and then scrolls, so a long draft sits behind a bar the
> reader is not using. Surfaced only while it moves, matching the transcript above it.*

### How to hide the bar while keeping scroll

**The utility already exists and is already in scope.** `.mz-scrollbar-on-scroll` is
defined at `packages/ui/src/styles/globals.css:354-381`, and `app/globals.css:11`
does `@import '@repo/ui/globals.css'` — so it is loadable from the app today.

```css
/* packages/ui/src/styles/globals.css:354 */
.mz-scrollbar-on-scroll {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 200ms ease-out;
}
.mz-scrollbar-on-scroll[data-scrolling] {
  scrollbar-color: var(--color-border) transparent;
}
```

The gutter is reserved at all times, so revealing the thumb causes no reflow. The
`data-scrolling` mark is written by `packages/ui/src/hooks/use-scroll-activity.ts`.

Your options, in order of preference:

1. **Import from `@repo/ui`** (`./components/*` is exported at
   `packages/ui/package.json:75`). Free fix. For the composer, diff the props first —
   the library version adds `locked`, `inputRef`, `showAttachButton` and i18n labels
   and redefines when `onStop` is offered, so it is a *type-compatible superset* but
   not a thoughtless drop-in for the flow's `busy`/`onStop` usage.
2. **Patch the fork** — add `'mz-scrollbar-on-scroll'` to the viewport className and
   wire `useScrollActivity()` into `onScroll`. Note the fork does **not** currently
   destructure `onScroll` out of props, so you must add that. This pays out across
   **seven** importers of the local composer, not just the intake flow.
3. **For the panel body and the recap `<dl>`** — these are the ones that can use the
   real component: `ScrollArea` exists at `packages/ui/src/components/scroll-area.tsx`
   with `@radix-ui/react-scroll-area` already installed, and Radix hides the native bar
   and draws a `bg-border` overlay thumb. It has **zero usages repo-wide**, so you are
   establishing the precedent, not following one. It is *not* viable for the transcript
   — the headless message-scroller must own the scroll node.

Tailwind v4.1.17 here ships **no** `scrollbar-hide` utility and no plugin is installed.
The repo's other precedent is the inline triple
`[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
(`attachment.tsx:287`, `tabs.tsx:300`, `admin-case-shell.tsx:384`) — that fully hides
the bar rather than revealing it on scroll, which is right for horizontal rows and
wrong for a transcript.

Hiding the bar costs nothing for keyboard users: the headless viewport already sets
`tabIndex ?? 0`, `role="region"`, handles Arrow/Home/End/PageUp/PageDown/Space, and
the fork already renders `focus-visible:ring-2 focus-visible:ring-inset`.

### Bonus: the autoscroll fights the user

- `UserTurn` opts into `<MessageScrollerItem scrollAnchor>` (`intake-message.tsx:70`)
  while `AssistantTurn` does not (`:199`). In the installed engine, a single new anchor
  makes the scroller inject a **viewport-tall spacer** to top-anchor that turn. That is
  a deliberate ChatGPT-style behaviour, but it is also a second source of apparent
  "empty space" (see §5), and nobody wrote the policy down.
- `AssistantTurn` then issues its *own* `scrollToEnd`/`scrollToMessage` on card reveal
  (`intake-message.tsx:174-196`), overriding the scroller's follow-mode.
- Every programmatic scroll is hard-coded `behavior: 'smooth'` with no
  `prefers-reduced-motion` check.
- `MessageScrollerItem` hard-codes `[content-visibility:auto] [contain-intrinsic-size:auto_3rem]`
  in **both** layers. `content-visibility: auto` implies **paint containment**
  unconditionally, so every row clips its own descendant painting — which visibly
  slices the `mz-animate-step` card entrance (`translateY(8px)`), plus shadows and
  rings. A 60-message cap is nowhere near the scale that justifies it. **Delete it.**

> *Verifier correction:* the first pass claimed this also strands a resumed reader
> mid-history. It does not — `MessageScrollerContent`'s ResizeObserver re-issues
> `scrollToEnd` as rows expand, and `autoScroll` leaves the scroller in
> `following-bottom`. The real cost is the clipping and a visibly shrinking thumb.

---

## 2. File input

### What the picker accepts today: everything

Neither file input sets `accept`. Both are bare:

```tsx
// intake-message.tsx:508-514  (AttachCard)
<input ref={inputRef} type="file" multiple className="hidden" onChange={handleInput} />

// design/intake/chat/chat-composer.tsx:346-352  (the paperclip)
<input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
```

`packages/ui/src/components/chat-composer.tsx:593-598` is identical. **`accept` is
absent from all three, and `accept` is not a prop on either `ChatComposerProps`**
(fork `:50-80`, 12 props; library `:51-124`, 24 props). That last part is the
component-level trap: you cannot pass it in without editing the component.

### Where it would be set

On the `<input>` — but the decision belongs in the component, as a prop, because two
different surfaces (the inline card and the composer) must agree. `level: both`.

### This is a wiring omission, not a missing capability

The repo already has the exact answer you want, twice:

```ts
// design/intake/components/document-upload-zone.tsx:24
const ACCEPTED = '.pdf,.doc,.docx,image/*';
```

That is precisely PDF + DOC + DOCX + images. That component also does it right
otherwise: `role="button"`, `tabIndex={0}`, Enter/Space handling, and a
`<Banner variant="destructive">` error surface (`:123-135`).

And `components/shared/file-dropzone.tsx` is a keyboard-accessible dropzone with an
`accept` prop, a drag-depth counter, and `DataTransferItemList` extraction.

Other precedents: `submit-work-form.tsx:99` (`.doc,.docx,.pdf`),
`playbook-assistant-panel.tsx:388`, `edit-photo.tsx:174` plus
`lib/image-utils.ts:21-39` (runtime MIME **and** size validation),
`create-legal-case-form.tsx:45` (15 MB limit + `toast.error`).

**Promote one canonical list** — e.g. `packages/ui/src/lib/file-accept.ts` exporting
both the `accept` string and a `matchesAccept(file, accept)` predicate (`./lib/*` is
exported at `packages/ui/package.json:74`).

### `accept` is not sufficient, and the data model blocks the real fix

`accept` is a picker **hint** only. It is bypassed by drag-and-drop entirely, and by
the picker's own "All files" escape hatch. You need a runtime gate — and here is the
trap:

```ts
// file-utils.ts:24-30
export function toIntakeFiles(list: FileList | File[]): IntakeFile[] {
  return Array.from(list).map((f) => ({ id: newId(), name: f.name, size: f.size }));
}

// intake-types.ts:37-41
export interface IntakeFile { id: string; name: string; size: number; }
```

**`f.type` is never read and the `File` object is discarded.** Past this one boundary
the only signal is the filename, so MIME validation is impossible — and after a reload
it is doubly impossible, because `use-intake-state.ts:123` persists via
`JSON.stringify` and `:84` rehydrates plain objects.

It *is* a boundary rather than a foreclosure: `addFiles`
(`conversational-intake-flow.tsx:362-367`) and `addPendingFiles` (`:378-380`) still
hold the live `File[]`, so the gate must go **there**.

**Do this:**

1. Add `type: string` **and** `lastModified: number` to `IntakeFile` — both
   JSON-serializable, so persistence is unaffected. `lastModified` is not optional:
   it is the only way to express the repo's own dedupe predicate
   (`create-legal-case-form.tsx:326-335` matches on name + size + lastModified).
2. Keep the real `File` bytes **out** of the persisted record — hold them in a
   non-persisted `useRef<Map<string, File>>` keyed by the same `id`, stripped before
   `JSON.stringify`. That unlocks MIME validation anywhere, `previewUrl:
   URL.createObjectURL(file)` for the image thumbnail path the composer already has
   (`chat-composer.tsx:248-253` — remember `revokeObjectURL` on remove), and an
   actual upload.
3. Replace `toIntakeFiles`'s unconditional map with
   `partitionFiles(files: File[]): { accepted, rejected: { file, reason: 'type' | 'size' | 'duplicate' }[] }`
   and call it from both ingest points, so the picker, the paperclip, the AttachCard
   drop and any future page-level drop share one gate.
4. There is **no size limit anywhere in the live flow**. The 15 MB constant exists only
   in the fallback form (`create-legal-case-form.tsx:45`) and
   `next.config.js` `serverActions.bodySizeLimit: '15mb'` — which does not apply here,
   since the flow posts JSON, not FormData. Promote the constant.
5. There is **no duplicate guard**, and both pickers actively enable repeats by doing
   `event.target.value = ''` after selection. The same file added twice yields two
   indistinguishable rows with different ids.

### Where a rejection message would live

Three places, and you want two of them:

1. **Per-file, on the card** — `Attachment` already has a `state="error"` variant:
   `error: 'border-destructive/50 bg-destructive/5'` (fork `:77`, library `:72`), and
   `AttachmentDescription` switches to `text-destructive` on it (`:208`).
   **But it is neutralised at all five call sites.** `cn()` is `twMerge(clsx(...))`
   and the variant is merged *before* the caller className
   (`foundations/attachment.tsx:115-118`), so the flow's
   `className="bg-muted/50 border-transparent"` strips the error border *and* fill.
   Affected: `intake-message.tsx:81`, `:423`, `chat-composer.tsx:249`, and two more.
   Fix the **fork** (it is what all five import): move the resting fill into the
   `idle`/`done` state variants, then reduce the call sites to
   `className="max-w-56 gap-0.5"`. Per-file text then has a wired slot already —
   set `ComposerAttachment.meta`.
2. **Batch summary** — an inline `<Banner variant="destructive">` in the transcript,
   matching `document-upload-zone.tsx:123-135`. This is the better primary surface
   because it lives where the user is looking and persists.
3. **Toast** — `sonner` is already imported in the flow. Note the flow currently only
   ever calls `toast.success` and bare `toast` (`:445`, `:453`, `:498`) and **never
   `toast.error`**. A toast alone is the wrong primary choice here: it vanishes, and a
   rejected upload is something the user must act on.

---

## 3. Drag and drop

### Which component handles drops

**Exactly one element in the live flow.** `AttachCard`
(`intake-message.tsx:378-399`) — and only while `message.card?.type === 'attach'`
**and** `interactive` is true. One card, during one step, at one scroll position.

```tsx
onDragOver={(e) => { if (!interactive) return; e.preventDefault(); setDragging(true); }}
onDragLeave={() => setDragging(false)}
onDrop={handleDrop}
// highlight: 'border-foreground/40 bg-muted/40 ring-ring/40 border-dashed ring-2'
```

### Which does not

- **The composer the flow actually uses.** `design/intake/chat/chat-composer.tsx` has
  **zero** drag handlers — grep for `onDrop|onDragOver|dataTransfer|DragEvent` exits 1.
  Its `<form>` (`:199-200`) carries only `onSubmit` and `onMouseDown`.
- The chat shell, the brief panel, the dashboard shell, the document.

**And here is the sharpest single fact in this audit:** the library version has the
whole thing, correctly, including the hazard you are about to ask about.

```tsx
// packages/ui/src/components/chat-composer.tsx:377-410, wired on the <form> at :441-445
const acceptsDroppedFiles = Boolean(onAttach) && !disabled && !locked;
const isFileDrag = (e) => Boolean(onAttach) && Array.from(e.dataTransfer.types).includes('Files');
const handleDragEnter = (e) => { if (!isFileDrag(e) || !acceptsDroppedFiles) return; dragDepth.current += 1; setIsDropTarget(true); };
const handleDragOver  = (e) => {
  // Taken even when the drop will be refused: leaving it to the browser
  // means a file dropped here replaces the page.
  e.preventDefault();
  e.dataTransfer.dropEffect = acceptsDroppedFiles ? 'copy' : 'none';
};
```

Drag-depth counter, file-drag type gate, `dropEffect`, `data-drop-target` for styling —
and a comment naming the page-replacement problem explicitly. The fork is a
line-for-line copy of this file **with the drop code removed** (identical root class
string at fork `:226` vs library `:456`, minus the `isDropTarget` branch at `:460`).
It is also covered by a test the fork inherits nothing from:
`__tests__/chat-composer.test.tsx:43-54`, *"leaves a text drag to the textarea."*

### What happens when a file is dropped outside the zone

**The browser navigates the tab to the file, replacing the page.** Per the HTML DnD
spec, an uncancelled `dragover` means the element is not a drop target, so the browser
runs its default action.

Nothing prevents it. Of the 29 `window`/`document.addEventListener` sites across
`apps/` + `packages/`, **none** registers `dragover`, `dragenter`, `dragleave` or
`drop`. Only four files in the entire repo handle drops at all, all element-scoped:
`intake-message.tsx`, `document-upload-zone.tsx`, `shared/file-dropzone.tsx`, and
`packages/ui/src/components/chat-composer.tsx` (unused).

**What the user actually loses** — be precise about this, it sets the severity:

- The **transcript survives**. `use-intake-state.ts` persists the snapshot to
  `localStorage['playground:new-case-intake:v2']` on a 300 ms debounce, and the flow
  re-hydrates on mount.
- What is lost: any **in-flight AI turn** (up to 12 s of work), the **`pendingFiles`
  dock** (component state, never persisted), and the user's place. Plus the
  navigation-guard dialog does not fire for a drop-navigation, so there is no warning.

So: recoverable, but jarring and silently destructive of the composer dock. On a
legal-intake form where the user has just spent five minutes describing a dispute, a
mis-aimed drop that blanks the screen reads as data loss whether or not it is.

### The smallest way to make the whole page a drop target

One hook, one mount point.

```
packages/ui/src/hooks/use-window-file-drop.ts        ← ./hooks/* is exported (package.json:76)
mounted from apps/legal-intake-design/components/providers.tsx
  (a FILE, not a directory; imported at app/[locale]/layout.tsx:4, rendered at :75)
```

Shape:

- `useEffect` registering non-capturing `dragover` + `drop` on `window`.
- Gate **both** on `Array.from(e.dataTransfer.types).includes('Files')` — reuse the
  predicate from `packages/ui/src/components/chat-composer.tsx:379-380`. Without this
  gate you break text drag-and-drop into the textarea.
- `e.preventDefault()` on `dragover` unconditionally (that alone stops the navigation),
  plus `dropEffect`.
- A `dragDepth` ref for the overlay state, and clear on `relatedTarget === null`.
- Route dropped files into the **same `partitionFiles` ingest** from §2 — the page-level
  target is where users will drop arbitrary junk, so it must filter and must surface a
  rejection.

Interaction with the existing `AttachCard` zone: its `onDrop` calls
`preventDefault()` and does not re-dispatch, so the window handler fires on the same
event but sees it already handled — guard with `if (e.defaultPrevented) return;` in the
window handler so a drop on the card is not double-ingested.

### Three more AttachCard bugs you would copy verbatim

1. **No drag-depth counter.** `onDragLeave={() => setDragging(false)}`
   (`intake-message.tsx:393`) with no `relatedTarget` check and **no `dragenter`
   handler at all**. `dragleave` bubbles from every descendant, so crossing onto the
   `AttachmentGroup`, the buttons, or the SVG clears the flag and the next `dragover`
   tick sets it back — visible flicker of `border-dashed ring-2`. The identical naive
   shape is repeated in `document-upload-zone.tsx:76-81`, while
   `shared/file-dropzone.tsx:24-43` does it correctly. **Never write a bare
   `onDragLeave={() => setX(false)}` in this repo.**
2. **No `dataTransfer.types` gate.** Dragging selected text, a link, or an image from
   another tab lights the full dropzone treatment, then `handleDrop` reaches
   `if (event.dataTransfer.files?.length)` — which is 0 — and nothing happens. All
   three live zones have this.
3. **`preventDefault` is inside the interactive guard.**
   `onDragOver={(e) => { if (!interactive) return; e.preventDefault(); … }}` — so on a
   *resolved* AttachCard the dragover is never cancelled and a drop on it navigates the
   page. Reorder so `preventDefault()` runs first.

Extract the counter + type gate once into
`packages/ui/src/hooks/use-file-drop-zone.ts` returning `{ isDropTarget, dropProps }`,
modelled on the library composer, and have every zone consume it. There are also four
unreconciled drag-active treatments across the repo and no drop-state token — pick one.

---

## 4. Loading and waiting

**The flow has exactly one loading indicator**, wired to one boolean (`thinking`).

```tsx
// design/intake/chat/typing-indicator.tsx
<Marker role="status" aria-label="Moritz is thinking">
  <Spinner className="size-3.5" />
  <MarkerContent className="shimmer">Thinking…</MarkerContent>
</Marker>
```

| # | Wait | What it looks like | Visibility |
|---|---|---|---|
| 1 | Opening greeting, `THINKING_MS = 650` (`:47`) | TypingIndicator | **visible** |
| 2 | AI turn, up to `AI_TIMEOUT_MS = 12000` (`:50`) | same indicator, unchanged, for 12 s | **visible but unhelpful** — no escalation |
| 3 | **AI timeout / failure → scripted fallback** (`:288-292`) | *nothing* — identical to success | **invisible** |
| 4 | **`enrichRecap` / `aiRecap`** (`:203-214`, fired `void` at `:317`) | *nothing* | **invisible** — and it rewrites the title and recap rows after the card is already submittable |
| 5 | Submission, 900 ms (`:463-503`) | spinner + `aria-busy` + disabled + "Submitting…" + toast | **visible — this one is good** |
| 6 | Hydration (`hydrated`, `use-intake-state.ts`) | empty transcript **with a live composer** | **invisible** — no skeleton |
| 7 | `StreamingText` word reveal (34 ms/word, 1400 ms floor) | text appears word by word | **visible, but it is fake latency** |
| 8 | **Stop** (`:404-414`, branch at `:284-286`) | indicator vanishes, nothing replaces it | **invisible** |
| 9 | **Attachment "upload"** — flow hardcodes `state: 'done'` (`:398`) | finished chip, instantly | **actively misleading** |
| 10 | Mobile first paint | desktop Sheet, then swaps to closed Drawer | **visible flash** |

### Too quiet to notice

**3, 4, 6, 8** are invisible. **9** is worse than invisible — it asserts a success that
never happened.

- **#4 is the one that will bite you.** `enrichRecap` gets no `AbortController` even
  though `aiRecap(req, signal?)` accepts one, no timeout, and no tracking ref. It
  fires after the recap is on screen and the typing indicator is gone, then silently
  rewrites the case title and swaps recap rows for AI paraphrases. It can also
  **resolve into a reset intake** — `performRestart` does not abort it, and reusing
  `aiAbortRef` cannot work because `:281` has already nulled it.
  *Fix:* pass a signal from a dedicated ref, abort from both `onStop` and
  `performRestart`, stamp requests with an intake generation counter and drop stale
  resolves. Render not-yet-summarised `<dd>`s as `<Skeleton />` from
  `@repo/ui/components/skeleton` (note it is `bg-accent animate-pulse` and
  `--accent: var(--mz-sky)` = `#ecf8fe`, so add `bg-muted` if you want neutral).
- **#3** is flattened twice: `/api/ai-intake` returns HTTP 200 `{ok:false}` for a
  missing key (`:21-23`), a bad body (`:29`), and any exception (`:42-43`); then
  `aiTurn` maps non-ok, non-`{ok:true}` and every throw (including `AbortError`) to
  `null` (`ai-intake-client.ts:27,32,33`). Six distinct failures become one silent
  value, and there is no error surface anywhere to put a different outcome in.
  *Fix the route first* (503 no-key / 429 rate-limit / 502 upstream), then return a
  discriminated `{ok:false, reason}` from the client, then build **one** error row in
  the transcript (`role="alert"` + Retry) **before** you build the happy path — the
  current flow has no slot to render it in, which is exactly why every failure had to
  be hidden.
- **#2** *Fix:* give `TypingIndicator` a `startedAt`/`phase` prop and swap the
  `MarkerContent` copy on a timer — "Thinking…" → "Still working…" at ~4 s.
- **#7** The Anthropic call is **not** streamed (`anthropic-intake.ts:73-108` awaits
  `response.json()`), so the whole reply exists client-side before a word is shown.
  `StreamingText` then fakes latency on top — and gates the inline card behind
  `streamingDone` (`intake-message.tsx:167`), so it withholds the only control the user
  can act on. Note `MS_PER_WORD` is a **floor**, not a cap: a long reply exceeds 1400 ms.
  *Fix:* `const totalMs = Math.min(MAX_DURATION_MS, total * MS_PER_WORD)`, render the
  card immediately, and make the reveal skippable.
- **#8** *Fix:* treat Stop as a state, not a cancellation. Append a real
  `Marker variant="border" role="status"` row reading "Stopped" plus a Retry chip. And
  on the **scripted** path, Stop currently clears the timer and **discards the user's
  answer entirely** — run `applyStep` synchronously instead.

### Accessibility of the loading states

`TypingIndicator` **does** have `role="status"` and an `aria-label` — correct, and
better than expected. But the transcript has **no `aria-busy`**: the headless
`MessageScrollerContent` defaults to `role="log"` with `aria-relevant="additions"`, and
`StreamingText` re-keys a span per word (`<span key={count}>`), so a screen reader is
fed **one word per announcement**. `IntakeChatShell` takes no `busy` prop at all.

*Fix:* add `busy?: boolean` to `IntakeChatShell`, forward as
`<MessageScrollerContent aria-busy={busy}>` (`message-scroller-examples.tsx:399`
already demonstrates this), and wrap the animating output in `aria-hidden="true"`,
rendering the finished message once on `onComplete` as the announced node. Setting
`aria-relevant="text"` on the streaming span does nothing — `aria-relevant` is only
honoured on the live-region root.

---

## 5. Empty space

### It is a shared component, not your flow

The void on the first screen is produced by `IntakeChatShell` (imported by **3** flows)
sitting inside the shared dashboard `main`. Full chain, with the contributing classes:

```
main                    flex-1 overflow-y-auto px-4 pb-10 pt-6   dashboard-shell.tsx:57
└ page                  h-full                                    client/new/page.tsx:12
  └ shell root          h-full md:pr-[376px]                      intake-chat-shell.tsx:84-87
    └ column            mx-auto flex h-full w-full max-w-3xl flex-col gap-6      :90
      ├ transcript      min-h-0 flex-1                            :91
      │ └ viewport      min-h-0 flex-1 overflow-y-auto            message-scroller.tsx:75
      │   └ content     flex flex-col gap-8 px-2 pb-6 pt-4        :95
      └ footer          space-y-3 md:-mb-8                        :109
```

**The mechanism:** the transcript is `flex-1` inside an `h-full` column, so with one
short greeting it still claims the full remaining viewport height. Content is
**top-aligned** — there is no `justify-end` and no `mt-auto` anywhere in the shell, the
scroller fork, or `packages/ui`'s copy. The composer is pinned to the bottom. The
greeting sits alone at the top with a tall void beneath it.

`level: both` — the rule is in the shared shell, but the flow chose not to compose a
first screen.

### What to do instead

**The obvious fix is a no-op — this is the correction worth reading.**

`justify-end` **alone does nothing here.** `MessageScrollerViewport` is a block with
`overflow-y-auto`, so Content's height is `auto` and there is no free space to
distribute. You need both:

```tsx
<MessageScrollerContent className="flex min-h-full flex-col justify-end gap-8 px-2 pb-6 pt-4">
```

(Equivalent: `flex flex-col` on the Viewport + `mt-auto` on Content.) Once the
transcript exceeds the viewport, `min-h-full` is satisfied and `justify-end` stops
mattering — so this is precisely a first-screen fix and does not disturb scrolling.

Then pick a composition for the first screen. The flow has **no one-message branch**
at all; `hasActiveIntake` (`:128`) already gives you the state to key off. Options:

1. Bottom-anchor (above) — cheapest, calmest.
2. Centre the composer on the first screen, migrate it to the bottom once
   `messages.length > 1`.
3. Fill the void with something you already have: the matter-type chips currently
   arrive as a *card after streaming completes* (`showCard && …streamingDone`), so the
   first paint is a lone bubble with no affordance at all — promote them into the first
   screen. The brief panel content and reassurance copy are also available.

### Three related layout traps in the same shell

- **`md:pr-[376px]` vs `md:w-[360px]` — two coordinate systems.** The gutter is `pr` on
  the shell root, which lives in `main`'s content box. The panel is `fixed` against the
  **app frame** (the portal container is `fixed inset-0 … [transform:translateZ(0)]
  md:bottom-2 md:left-2 md:right-2`, and the transform makes it the containing block).
  At `md` (768 px) the frame inner is 752, `sm:px-6` yields a 704 px content box, and
  the needed reserve is 336 px — so 376 px **over-reserves by ~32 px**, and the error
  grows above 1264 px once `max-w-7xl` starts centering. A CSS var does not fix this;
  only picking one coordinate system does.
- **The `md:-mb-8` counter-hack.** All three dashboard chrome variants apply `pb-10 pt-6`
  document-page padding to every child including the chat, and the shell fights it with
  a negative margin plus a five-line comment naming the coupling. The same literal is
  copy-pasted into `case-chat.tsx:364`. **Do not copy it.** Use the escape hatch the
  repo already invented: `app/globals.css:506` has
  `main:has(> .case-workspace-wide) { max-width: none; }` and its comment at `:497-505`
  diagnoses this exact class of bug verbatim. Add a sibling rule for the intake surface.
- **Transcript `px-2`, composer `px-0`.** The transcript is inset 8 px
  (`MessageScrollerContent`), the footer div has no horizontal padding, and
  `ChatComposer`'s outermost element is the `<form>` itself with no margin. So the
  conversation's edges never line up with the input. Pick one gutter and put it on the
  flex column at `:90`.
- **`Bubble`'s `ghost` variant deletes the measure cap.** `bubbleVariants` caps at
  `max-w-[80%]`, but `ghost: 'w-full max-w-full'` removes it — deliberately, per the
  docblock, so rich cards can span the row. Every assistant turn uses `ghost`, so
  assistant prose runs ~710 px / **~100 characters per line**. Don't edit the variant;
  wrap the prose bubble in `max-w-[68ch]` (Tailwind v4 accepts `ch`; no measure token
  exists in either stylesheet).

---

## 6. Text and contrast

### First, the correction: the palette is mostly fine

I computed these from the real hex ramp rather than assuming. Method: sRGB relative
luminance per WCAG 2.x (linearise each channel, `L = 0.2126R + 0.7152G + 0.0722B`),
ratio `= (L_light + 0.05) / (L_dark + 0.05)`.

| Token | Value | On `#ffffff` | Verdict |
|---|---|---|---|
| `--foreground` | `--mz-gray-190` `#282829` | **14.7:1** | pass |
| `--muted-foreground` | `--mz-gray-160` `#58595b` | **7.01:1** | **passes AA *and* AAA** |
| `--field-placeholder` | `--mz-gray-130` `#77787b` | **4.41:1** | **fails AA (< 4.5:1)** |

So the flow's ubiquitous `text-muted-foreground` is **not** a contrast failure. Almost
every real defect here is about **size**, or about **opacity stacked on top of a token**.
If you go in planning to darken the muted token, you will be fixing the wrong thing.

### The one genuine token-level contrast failure

`--color-field-placeholder: var(--mz-gray-130)` — `#77787b`, **4.41:1**, applied by the
composer as `placeholder:text-field-placeholder` on text that is **14 px** on desktop.
Normal-size text, so 4.5:1 is the bar, and it misses.

Defined identically in **two** stylesheets: `packages/ui/src/styles/globals.css:290`
and `app/globals.css:240`. The app comment calls it deliberate ("a lighter placeholder
gray than `muted-foreground`").

*Fix:* re-anchor to `--mz-gray-140` `#6d6e71` (**5.10:1**) or `--mz-gray-150` `#636466`
(**5.92:1**) in **both** files. `component` level, and it is a global change — say so
before you make it.

### Opacity stacked on an already-muted token

| Where | Effective | Ratio |
|---|---|---|
| `opacity-70` on recap row icons — `intake-message.tsx:611` | `≈#8a8b8c` | **3.43:1** — passes 3:1 for a graphical object, marginally |
| `disabled:opacity-50` on locked chips — fork `chip.tsx:40` | — | **~3.0:1 / 2.27:1** |

The second one matters far more than it looks, because of **how the flow uses
`disabled`**. `ChipsCard` sets `disabled={locked && !isSelected}` where
`locked = !interactive || selectedChipValue !== undefined` (`:294,:301`), and
AttachCard disables its four buttons on `!interactive`. In other words **the native
`disabled` attribute is being used to mean "this turn is history"** — so the
*permanent, scrollable transcript record* of the conversation renders at 50 % opacity,
around 3:1 and below.

Any rebuild of a chat transcript needs exactly this locked-past-turn state, and
reaching for `disabled` is the obvious move. **This is one of the most likely things
you will reproduce verbatim.** *Fix:* add a `locked`/`readOnly` variant to the fork
Chip that renders `aria-disabled="true"` + `pointer-events-none cursor-default` with
real token colours (`text-muted-foreground border-border` for unchosen, keep
`bg-primary text-primary-foreground` for the chosen one) and **never** sets the DOM
`disabled` property.

### The type scale is inverted: desktop gets smaller text

Most size variants in **both** layers step type **down** at `sm:` (40 rem). This is
mobile-first density collapse applied to font size, and it is baked into cva:

| Component | Variant | Mobile → Desktop | Used at |
|---|---|---|---|
| fork `chip.tsx:55` | `size="sm"` | `text-sm` → `sm:text-xs` = **14 → 12 px** | `intake-message.tsx:300`, `:334` |
| `packages/ui/badge.tsx:27` | default | `text-sm/5` → `sm:text-xs/5` = **14 → 12 px** | `intake-message.tsx:411` ("N files") |
| `chat-composer.tsx:309` | textarea | `text-base/6` → `sm:text-sm/6` = **16 → 14 px** | the composer |

*Fix:* delete the `sm:text-*` clause in the fork's `chip.tsx:53-56` and
`button.tsx:85-91`, keeping only the `sm:px-*`/`sm:py-*` density collapse, so size is
breakpoint-invariant. Drop `sm:text-sm/6` from the textarea and keep `text-base/6`
(16 px also kills iOS Safari focus-zoom).

> *Verifier correction:* you cannot fix Badge from the call site. `cn()` is
> tailwind-merge, which treats `text-sm/5` and `sm:text-xs/5` as different groups
> because of the modifier — passing `className="text-sm/5"` leaves `sm:text-xs/5`
> intact and it still wins at `sm`. Fix the variant.

### The conversational reading surface is pinned to 14 px

`bubbleContentVariants`' base hard-codes it: `… px-4 py-2.5 text-sm leading-relaxed
break-words …` (fork `bubble.tsx:110`, byte-identical at `packages/ui/bubble.tsx:107`),
and the flow re-asserts `text-sm` on the assistant column wrapper
(`intake-message.tsx:202`). So **the actual message text — the thing the user reads
most — is 14 px with no responsive step and no opt-out short of a className override at
every call site.**

*Fix:* change the base to `text-base/relaxed` in both copies and delete the redundant
`text-sm leading-relaxed` from `intake-message.tsx:202` so the primitive is the single
source of truth.

Related: the `Text` primitive (fork `text.tsx:36`) defaults to
`'text-muted-foreground text-base/6 sm:text-sm/6'` — **body copy is muted and 14 px by
default**, and readable primary text requires an override. It is used in
`case-submitted-card.tsx:168,170`. *Fix:* land it in the fork (only seven call sites,
all inside `components/design/`) by adding a `tone` variant defaulting to
`text-foreground`.

### The 11 px uppercase eyebrow — below the token scale floor

Three files, three different trackings, all written **inline in the flow's JSX**:

| Location | Class |
|---|---|
| `intake-message.tsx:609`, `:623` | `text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground` |
| `intake-brief-panel.tsx:95` | `text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground` |
| `case-submitted-card.tsx:140` | `text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground` |

11 px is an arbitrary value below the Tailwind scale; uppercase plus letter-spacing
costs further legibility at that size. Contrast is fine (7:1) — the problem is purely
size. `level: flow`, trivially avoidable, **but it is the "visual language" you said
you are keeping**, so it will get copied. Decide once: either promote it to a real
token/component (an `<Eyebrow>` at `text-xs` with one tracking value) or stop using it.

Full inventory: **15** instances of `text-xs` / `text-[11px]`, all paired with
`text-muted-foreground`, all inline in the flow.

### Filenames are truncated with no way to recover them

Both copies of `AttachmentTitle` hard-code `'truncate font-medium'` +
`size === 'xs' ? 'text-xs' : 'text-sm'` (fork `:187-188`, library `:220-221`), and
`AttachmentDescription` hard-codes `'truncate text-xs'` + muted (`:207-208`). **No
`title` attribute and no tooltip anywhere.** The flow then picks widths that guarantee
clipping: `w-40` (160 px) at `intake-message.tsx:81` and `max-w-56` at `:423`.
`Master_Services_Agreement_v3_FINAL_signed.pdf` becomes unreadable and unrecoverable —
including the extension, which is the only file-type signal the data model retains.

*Fix, in the component:* `children` arrives inside `...props`, so
`title={typeof props.children === 'string' ? props.children : undefined}` placed
**before** `{...props}` survives the spread and gives every consumer a native tooltip.
Then swap `truncate` for `line-clamp-2 break-all` so the extension survives, and widen
the call sites to `w-56`/`max-w-72`.

### `.shimmer` renders invisible text in print and forced-colors

Defined twice with identical bodies (`packages/ui/globals.css:556-570` and
`app/globals.css:482-496`; the app copy wins, since both are unlayered at equal
specificity and the app's import comes first). Both set `background-clip: text` +
`color: transparent`. The only branch that restores real ink is
`@media (prefers-reduced-motion: reduce)`. So in print, forced-colors mode, or any
engine without `background-clip: text`, the "Thinking…" label and every uploading
`AttachmentTitle` are **invisible**.

> *Verifier correction:* the first pass proposed
> `@supports (background-clip: text) and (not (forced-colors: active))`. That is
> **invalid CSS** — `forced-colors` is a media feature and cannot appear in an
> `@supports` condition; the parser would drop the rule wholesale.

*Fix:* give base `.shimmer` an unconditional `color: var(--muted-foreground)`, move
only `background-clip: text; -webkit-background-clip: text; color: transparent` into
`@supports (background-clip: text)`, and add a separate
`@media print { .shimmer { color: var(--muted-foreground); background-image: none; } }`
plus a `@media (forced-colors: active)` reset.

---

## 7. Focus and keyboard

### Can the whole flow be completed with a keyboard? No.

It is **reachable** but not **completable**. There is one hard blocker and one
repo-wide idiom that destroys focus at every step.

### The hard blocker: the case title cannot be edited by keyboard

`RecapCard` renders the case name through `InlineField` (`intake-message.tsx:588-596`).
Its resting state:

```tsx
// design/playbook-studio/inline-field.tsx:137-151
<span
  {...editableProps}
  onClick={(event) => { editableProps?.onClick?.(event); setIsEditing(true); }}
  className={cn('hover:border-border/60 cursor-text border-b border-transparent …')}
>
  {isEmpty ? placeholder : value}
</span>
```

**No `tabIndex`, no `role`, no `onKeyDown`.** You cannot Tab to it and you cannot
activate it with Enter or Space. It is mouse-only. The `aria-label: 'Case name'` passed
via `editableProps` lands on a non-interactive `<span>` and does nothing.

Once editing (reachable only by click) the `contentEditable` span is fine: Enter
commits, Escape reverts, blur commits. So the commit model is not the problem —
**reachability is.**

> *Verifier correction:* this component is **not** in `design/intake` or `foundations`.
> It lives at `design/playbook-studio/inline-field.tsx` (with a second copy in
> `playbook-studio-admin/`) and is pulled into the intake flow by a **cross-feature
> relative import** at `intake-message.tsx:49`. That import is the actual smell.

*Fix:* don't import from `playbook-studio/` at all. Build the recap title inside
`new-case/` from the foundations `Input`, or as a `<button>`-swaps-to-`<input>` pair, so
the element carries a real role that can hold `aria-label`, Enter/Space/click all enter
edit mode, and commit refocuses the resting trigger inside `requestAnimationFrame`
(that rAF-refocus idiom already exists at `chat-composer.tsx:195`). Leave the
playbook-studio copies alone unless you own that surface.

### The generic cause: "the control you just activated disappears"

This single idiom recurs across the whole repo. When the focused element is removed or
`disabled`, `document.activeElement` resets to `<body>` and the **next Tab restarts
from the top of the page.**

| Instance | Where |
|---|---|
| `Button` `isPending` → native `disabled` on the button just pressed | `foundations/button.tsx:123,142`; Submit at `intake-message.tsx:651-658` + `setSubmitting(true)` at `:465` |
| AttachCard's four buttons `disabled={!interactive}` | `intake-message.tsx:453,462,491,501` |
| `SkipChip` unmounts itself — rendered `&& interactive`, and activating it makes the turn non-last | `intake-message.tsx:234-236` |
| Recap turn **remounted with a fresh id** on submit | `conversational-intake-flow.tsx:481-487` |
| Remove-attachment buttons unmount the control just activated | both composers + AttachCard |
| `MessageScrollerButton` blurs itself on activation | `foundations/message-scroller.tsx` |
| Foundations `Alert` drops focus to `<body>` on **every** close | used by `LeaveIntakeDialog` |

**`ChipsCard` is the one place that gets it right** (`intake-message.tsx:294-312`): it
keeps the chosen chip mounted and focusable, marks it `aria-pressed`, and only disables
the *siblings*. **Carry that invariant into every inline card in the rebuild.**

*Fix for the component:* stop using native `disabled` for transient busy state in
`foundations/button.tsx`. When `isPending`, keep the button focusable, set
`aria-disabled="true"` + `aria-busy="true"`, and no-op the handler — the file already
argues for keeping pointer events on for the same class of reason (`:62-67`). Reserve
native `disabled` for genuinely unavailable controls.
*Fix for the flow:* every step transition must explicitly park focus — move it to the
new turn's heading with `tabIndex={-1}` + `.focus()`.

### The hidden footer is an invisible focus trap

```tsx
// conversational-intake-flow.tsx:600-608
<div aria-hidden={footerHidden}
     className={cn('transition-all duration-300 ease-out',
       footerHidden ? 'pointer-events-none max-h-0 -translate-y-1 overflow-hidden opacity-0' : …)}>
```

None of `aria-hidden`, `pointer-events-none`, `max-h-0`, `overflow-hidden` or
`opacity-0` removes focusability. Containment relies **entirely** on
`disabled={footerHidden}` being threaded to every control. Three of four are. The
send/stop button has a busy escape hatch, so **Stop stays tabbable inside a zero-height
invisible container.** Separately, `aria-hidden` over focusable content is an ARIA
violation in itself.

*Fix:* `inert={footerHidden}` on the wrapper. React 19 supports it natively; it removes
the subtree from tab order, hit-testing **and** the accessibility tree in one attribute,
and is immune to any control forgetting its `disabled` binding. Keep `disabled` on the
textarea for the `has-[textarea:disabled]:` styling hooks.

### The docked panel is hidden from screen readers but still tabbable

The desktop Sheet is portaled into
`<div ref={setPortalContainer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden …">`
(`intake-chat-shell.tsx:112-125`, `container={portalContainer}` at `:150`). So the
`SheetTitle`, the `SheetDescription`, the whole brief panel, and the **"Start over"**
button sit inside an `aria-hidden` subtree — invisible to assistive tech, fully
reachable by Tab.

Two more in the same component:

- `<Sheet open onOpenChange={…} modal={false}>` (`:145`) passes `open` as a **bare
  literal**, so `isPanelOpen` (computed at `:67`) is unused on the desktop branch and
  **the desktop panel cannot be closed.**
- Both header chromes wire the toggle with `aria-controls="intake-progress-panel"`
  (`site-header.tsx:101`, `top-nav.tsx:362`). **No element in the app carries that
  id.** `top-nav` hides its button at `md:hidden`; `site-header`'s copy
  (`ml-auto size-7`) does not, so in the sidebar chrome it renders on desktop as a
  no-op that flips `aria-expanded` to `false` while the panel stays on screen.

*Fix:* drop `aria-hidden` from the clipping container; export
`INTAKE_PANEL_ID` from the panel context and set it on both `DrawerContent` and
`SheetContent`; honour `isPanelOpen` on the desktop branch.

### Smaller, still worth knowing

- **The composer never takes or returns focus.** No autofocus on mount, and no refocus
  after send — `handleSubmit` → `onSend` → `setDraft('')` with no `.focus()`. Compare
  `handleStopRecording`, which *does* rAF-refocus (`:195`). So every load and every
  sent message starts a Tab hunt. *Fix:* expose a ref or `autoFocus` prop on
  `ChatComposer` (it already owns `textareaRef`) and drive it from the orchestrator —
  don't reach for `document.querySelector('textarea[aria-label="Message Moritz"]')`,
  which breaks the moment two composers coexist.
- **`LeaveIntakeDialog` has no Cancel button** and lists the destructive action first:
  only "Delete case" (`variant="destructive"`) and "Save as draft". Escape and
  outside-click are treated as cancel, but there is no *visible* way to say "stay
  here." *Fix:* add an explicit Cancel, and don't autofocus the destructive action.
- **On mobile the panel is a modal Drawer open by default** (`isPanelOpen` defaults
  `true`), so a phone load **traps focus in the panel** before the user has done
  anything. And because `useIsMobile` returns `false` until its mount effect runs, the
  first painted frame is the *desktop* Sheet. *Fix:* don't branch layout on a value
  that is only correct after paint — render both and let CSS choose (`hidden md:block`
  / `md:hidden`), or render neither until the tri-state resolves.
- **Focus-visible rings are present** on the foundations Button, Chip, the scroller
  viewport and the jump button. The textarea's `outline-none` is compensated by the
  parent form's `focus-within:after:ring-2`. This part is fine.

---

## 8. State feedback

### There are exactly two live regions in the whole flow

`MessageScrollerContent` gets `role="log"` + `aria-relevant="additions"` from the
headless primitive, and `TypingIndicator` sets `role="status"`. **Everything outside
the bubble stream changes with no announcement and mostly no visual acknowledgement.**

### Every silent change

| # | What changes | Where | What the user perceives |
|---|---|---|---|
| 1 | **Continuous autosave** — full snapshot to `localStorage`, 300 ms debounce, on every state change | `use-intake-state.ts:118-131` | nothing |
| 2 | **`MAX_MESSAGES = 60` drops the OLDEST messages** | `:14`, `:97-98` | nothing — silent data loss |
| 3 | The one "Saved as draft" toast is **unconditional**, on a path where saving already happened continuously | `conversational-intake-flow.tsx:445` | misleading: the only time saving is mentioned is the one time it wasn't news |
| 4 | **Case title rewritten** by a late, unabortable AI call — header, panel `SheetTitle`, and the recap card all change | `:203-214`, fired `:317`; bound `:516-518` | text changes under them |
| 5 | **Recap rows swap the user's own words for an AI paraphrase** — `summary ?? raw` | `intake-message.tsx:570-574` | no indicator, no revert, no "edit" |
| 6 | **Brief panel never shows a captured answer** — rows are `{ key, label, state }` rendered as a bare `<p>{step.label}</p>`; `answers` is read only via `isFilled` | `intake-brief-panel.tsx:64-68`, `:148-157` | the panel whose job is "here's what Moritz captured" shows only question labels |
| 7 | All four `StepDot` variants are `aria-hidden="true"` | `:171,181,191,198` | complete / active / skipped / upcoming exist **only as colour and shape** |
| 8 | `role="progressbar"` `aria-valuenow` changes | `:103-108` | value changes are not announced without a live region |
| 9 | **The composer footer vanishes entirely** for the documents and recap steps | `:525-528` | the input disappears with no explanation |
| 10 | **Files committed and bytes discarded**, while chips assert `state: 'done'` | `:240`, `:398`, `file-utils.ts:24-30` | believes a document was uploaded; nothing ever left the browser |
| 11 | AI timeout/failure → scripted reply | `:288-292` | cannot tell AI from canned |
| 12 | Stop | `:284-286` | indicator vanishes, no reply, no "stopped" |
| 13 | **Submitted card replaces the recap in place** with a fresh id | `:479-497` | content they were reading is destroyed under them |
| 14 | `void description` — the computed description is deliberately discarded | `:473-475` | — |
| 15 | Design flags (`useAiCaseIntake`, `useEnterpriseAccount`) change behaviour | `:83-85` | invisible |
| 16 | Silent reset when `!hasActiveIntake` (no toast, unlike `onLeaveDiscard`) | `:430-432` | — |
| 17 | **Enter while thinking is a silent no-op** — `handleSubmit` bails on `busy`, but the textarea is only disabled on `footerHidden`, never on `busy` | `chat-composer.tsx:162,167,307` | types, presses Enter, nothing happens |
| 18 | **A refresh during an in-flight turn** leaves a permanently stalled transcript — the user message is persisted, `thinking` is not | `use-intake-state.ts:16-35` | a question with no answer, forever, no retry |
| 19 | Voice capture is a hardcoded stub that presents as real | `chat-composer.tsx:85,188-196` | inserts a canned sentence |

### What to do instead

- **Surface the autosave.** The repo already has the component:
  `SaveStatusIndicator` renders `aria-live="polite"` with "Saving…" / "Saved 2 min ago".
  *Caveat before you reuse it:* its status union is `'idle' | 'saving' | 'saved'` with
  **no `'error'`**, and the component returns `null` for any other value — so passing
  `status: 'error'` renders nothing. Extend the union when porting.
- **Never substitute generated text for rendered text silently** (#4, #5). Either show
  the raw answer as the row value with the AI summary as explicitly-labelled secondary
  text ("Moritz's summary" + a `Badge variant="outline"`), or show the summary behind a
  visible "AI-summarised — show what I wrote" disclosure with a per-row revert. If a
  swap does land after render, mark the changed row — a one-shot `mz-animate-step`
  highlight on the `<dd>` plus a `role="status"` announcement.
- **Render the value in the brief panel** (#6) — but guard the helper: `displayAnswer`
  is typed `string | null` and returns `null` for an unanswered key, so
  `<dd>{displayAnswer(q, answers)}</dd>` yields an empty `<dd>` for every upcoming row.
  Fall back to `q.hint` (the field exists at `intake-types.ts:68-69` for exactly this)
  or an explicit "Not yet". Also give the step state a text equivalent, not just colour
  (#7) — the dots are all `aria-hidden`.
- **Tell the user the trim happened** (#2), or raise the cap and paginate. Silently
  dropping the beginning of a legal intake is the worst item on this list.
- **Add one `aria-live="polite"` region** owned by the flow for step transitions,
  captured answers, and file results. Right now a screen-reader user learns nothing
  about any of the 19 rows above except new bubbles.
- **Persist the pending turn** (#18): add `pending?: { messageId, startedAt }` to
  `IntakeSnapshot`, set it in the same update that appends the user message, clear it
  in `applyStep`, and on hydration either re-issue or render an explicit recovery row.
- **Queue the draft on Enter-while-busy** (#17) so the keystroke has a consequence, or
  at minimum swap the placeholder through the slot that already exists for the
  recording state.

---

## The five I am most likely to repeat

Ranked by **likelihood of repetition**, not severity. Two things drive the ranking:
whether the defect is **inside a component you will import** (so you inherit it without
writing it), and whether it is **invisible at review time** (so nothing prompts you to
look). Items you explicitly asked about — the file `accept` list, the page-level drop
target, the first-screen void — are **de-ranked**, because asking the question is most
of the cure. You will not forget those. You will forget these.

---

### 1. Importing `design/foundations` / `design/intake` instead of `@repo/ui`

**`component` · the meta-trap**

This is not one bug, it is the delivery mechanism for at least five of them. Reuse the
forks because they *are* the visual language, and you silently inherit: bare OS
scrollbars on the transcript and composer (§1), **zero** file-drop handling plus the
page-replacement hazard the library already documents and fixes (§3), the missing
`motion-reduce:transition-none` guards, the inverted `sm:` type scale (§6), and a
neutralised `Attachment` error state (§2).

Every one of those is *already fixed* in `packages/ui`. The fork is the older, thinner
copy that 17 of the flow's 19 imports point at. Nothing in the code warns you: the
class strings are near-identical, the component names are identical, and the fork's own
docblock says "TODO(@repo/ui): fold this primitive into `packages/ui`."

**Decide the base layer in writing before you start**, back-port the four components
where the fork is genuinely ahead (Drawer, Dialog, Table, InputOTP), and never import
the same concept from both layers in one screen.

---

### 2. "The control you just activated becomes `disabled` or unmounts"

**`both` · invisible unless you test with a keyboard**

`isPending` → native `disabled` on the button under the user's finger. `SkipChip`
rendered `&& interactive`. The recap turn remounted with a fresh id. Remove-attachment
buttons that unmount themselves. Seven instances, one idiom, and each one drops
`document.activeElement` to `<body>` so the next Tab restarts at the top of the page.

You will repeat this because it is the natural way to write a chat step and because a
mouse never reveals it. `ChipsCard` is the one correct implementation in the repo —
copy *its* invariant (keep the activated control mounted and focusable, `aria-pressed`,
disable only the siblings) into every inline card.

Compounding it: the hidden composer footer uses `aria-hidden` + `max-h-0` rather than
`inert`, leaving a tabbable Stop button in a zero-height invisible box. Use React 19's
`inert`.

---

### 3. Letting generated text replace rendered text with no state for it

**`both` · your rebuild will have the same AI enrichment**

`enrichRecap` fires `void` after the recap is on screen, with no `AbortController`
(though the client accepts one), no timeout, and no tracking ref. It rewrites the case
**title** in three places at once and swaps recap rows for AI paraphrases via
`summary ?? raw` — the user's own words, replaced, with no indicator and no revert. It
can even resolve *into a reset intake*, because `performRestart` does not abort it.

Any v2 with AI enrichment reproduces this exactly, because the shape "fire the
enrichment after render so the card appears fast" is the obviously correct performance
choice. Make it correct: pass a signal from a dedicated ref, abort on stop *and*
restart, stamp requests with a generation counter, drop stale resolves, and render
pending rows as `<Skeleton />` rather than letting finished-looking text mutate.

And decide *now* that a paraphrase never silently replaces what someone typed. On a
legal intake that is a trust problem, not a UI problem.

---

### 4. Using native `disabled` to mean "this turn is history"

**`both` · the transcript's permanent record renders at ~3:1**

`disabled={locked && !isSelected}` on past chips, `disabled={!interactive}` on resolved
AttachCard buttons — and the fork's Chip and Button both end in
`disabled:cursor-not-allowed disabled:opacity-50`. So the scrollable, permanent record
of the conversation sits at 50 % opacity, around **3.0:1 and 2.27:1**.

This one is subtle enough that it will survive review: it looks intentional, it looks
like "past tense," and the alternative requires inventing a variant. It also collides
with #2 — `disabled` is simultaneously wrecking the contrast *and* dumping focus.

Add a `locked` variant that uses `aria-disabled` + `pointer-events-none` with real
token colours, and never set the DOM `disabled` property to express history.

---

### 5. Inheriting the type floor while "keeping the visual language"

**`component` + `flow` · the thing you said you are reusing *is* the trap**

Three compounding layers, none of which announce themselves:

- `bubbleContentVariants` hard-codes **`text-sm`** — the message text, the most-read
  content in the product, is 14 px with no responsive step and no opt-out.
- The cva variants step type **down** at `sm:`, so desktop gets *less*: Chip 14→12 px,
  Badge 14→12 px, the composer 16→14 px.
- The flow layers 15 inline `text-xs`/`text-[11px]` + `text-muted-foreground` labels on
  top, including an 11 px uppercase eyebrow written three times with three different
  letter-spacings.

The contrast is mostly fine — `muted-foreground` is 7.0:1, which is why this is easy to
wave through. The failure is size, plus the one genuine token miss
(`--field-placeholder` at **4.41:1**) and opacity stacking.

Fix it in the variants once — breakpoint-invariant sizes, `text-base/relaxed` on the
bubble, `--field-placeholder` re-anchored to `mz-gray-140` — before you build screens
on top, because every screen you build will inherit the floor and then you will be
editing 40 call sites instead of 4.

---

## Checked and *not* a problem

Verified directly; do not spend time "fixing" these.

- **`design-system/button.tsx` is a 10-line re-export shim** of the foundation Button,
  and `isPending` is fully implemented there — spinner, `aria-busy`, and `disabled`.
  The Submit button's pending state genuinely works (its only sin is the focus drop in
  trap #2). Double-submit is also guarded at `conversational-intake-flow.tsx:464`.
- **`prefers-reduced-motion` is handled at the CSS keyframe layer.**
  `app/globals.css:510-534` guards `.mz-animate-check`, `.mz-animate-draw`,
  `.mz-animate-reveal`, `.mz-animate-step`, `.mz-word-in`, `.mz-animate-waveform` and
  `.shimmer`; `StreamingText` checks `matchMedia` and renders instantly. **The gap is
  the Tailwind `transition-*`/`animate-*` utilities** (15 unguarded sites, and the
  forks dropped the `motion-reduce:` classes `@repo/ui` has) — fix that with a blanket
  rule in the existing reduced-motion block plus an `animate-spin` opt-back-in, not by
  auditing classes one at a time.
- **`--muted-foreground` passes WCAG AA and AAA** at 7.01:1. Darkening it is the wrong
  fix; the problems are size and opacity stacking.
- **`TypingIndicator` has `role="status"` and an `aria-label`.** The transcript's
  missing `aria-busy` and the per-word re-keying are the real defects, not the
  indicator itself.
- **`justify-end` alone will not bottom-anchor the transcript** — you need
  `min-h-full justify-end` together.
- **You cannot fix the Badge type size from the call site** — tailwind-merge treats
  `text-sm/5` and `sm:text-xs/5` as different groups. Fix the variant.

---

## Appendix: method

Eight parallel dimension audits over `components/design/new-case/` (2,946 lines),
`components/design/intake/`, `components/design/foundations/components/`,
`components/ui/`, `packages/ui/src/`, both `globals.css` files, and the layout chain
from `dashboard-shell.tsx` down. Each dimension's findings were then handed to an
adversarial verifier instructed to refute them — re-opening every cited line, grepping
all five layers before accepting any "missing" claim, checking layer attribution, and
testing whether each proposed remedy is actually implementable at the installed
versions.

59 initial findings: **0 refuted, 14 confirmed as written, 45 corrected** (citations,
layer attribution, or an unworkable remedy), plus **37** added by verifiers and **8** by
a completeness critic. Contrast ratios were computed from the resolved hex values in
`app/globals.css:32-55`, not estimated. The corrections were the valuable part — three
of the initial "the component is missing X" claims turned out to be wrong, which is the
failure mode a previous audit of this codebase shipped.
