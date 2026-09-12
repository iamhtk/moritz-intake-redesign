# Audit v2 — Plan critique and UI traps

**11 September 2026**

Adversarial review of my own plan — written to find weaknesses before build, not to bless the thesis.

---

## PART A. Attack the plan

### 1. Strongest argument that the thesis is wrong

**The thesis misdiagnoses the disease.**

You say: Moritz understands the case, hides that understanding, and blocks correction — therefore the fix is to make the brief the product.

That story flatters a product that, on the shipped defaults, **does not understand the case at all.** `useAiCaseIntake` defaults to off. The “living brief” today is a checklist of labels driven by a scripted state machine. Free-text matter descriptions are rejected. The opening “Thinking…” is a fake 650ms delay. So the client pain is often not “I can’t see or edit what Claude got wrong” — it is “this thing pretends to be smart, then forces me into six lawyer nouns and won’t take my sentence.”

Even if AI were on, the thesis still over-indexes on **transparency of intermediate state** as the primary trust lever. For a distressed non-lawyer, the opposite can be true:

- They did not come to *manage a case brief*. They came to *hand a problem to someone*.
- A dense panel of legal-ish fields (parties, urgency, matter type, outcome) can feel like a form the firm is making *them* fill — the exact anxiety you are trying to remove — especially when half the fields are empty or wrong.
- Trust in legal intake is usually about **outcome clarity** (what happens next, who sees this, what it costs, how long) and **competence signals** (did you ask the right thing once), not about a two-pane IDE for their dispute.

Strong version of the counter-thesis: **the winning product is a short, honest path to a quote and a human, with optional document assist — not a Canvas clone for case data.** Your plan risks rebuilding Cursor for people who wanted Concierge.

If Monday’s reviewers already believe “chat + sidebar brief” is the obvious Moritz move, a prettier version of that will read as incremental, not as a rethink.

### 2. Clients with no document

**The plan’s rhetoric collapses; the product does not have to — but only if you demote the document from hero to accelerator.**

Your own framing: *“the uploaded document does most of the work.”* That is a majority-path claim. Self-serve intake without a file is common (employment question, “do I need a lawyer,” early M&A curiosity, nothing drafted yet). For those users:

- Screen 1 (“describe + drop document”) becomes a describe-only screen with a large unused drop zone that screams “you’re doing it wrong.”
- Screen 2’s “living brief” starts empty. Chat must do *all* the work — which is exactly today’s architecture with a louder sidebar. You have not escaped the scripted Q&A problem; you have moved it.
- Extraction-led confidence UX never fires. The differentiator you sell in the email never appears.

So: **the idea does not require a document to function, but your thesis requires a document to be interesting.** Without one, you are shipping “chat fills an editable form” — which is the obvious candidate solution (see §5), not the document-native one.

Hard requirement if you keep the thesis: Start must feel complete with text alone, and Build must have a first-class empty-brief path that does not look like a failed extraction.

### 3. Wrong extraction and trust

**Yes — confident wrong data is often worse than showing nothing.**

Showing nothing fails by opacity. Showing wrong values fails by **false consensus**:

- Clients assume the system “read the PDF,” then only skim. Rubber-stamping is the default under time pressure.
- Wrong party names, wrong counterparty, wrong dollar amounts in a legal brief are not typos — they are liability-shaped. Reviewers will ask what happens when extraction invents a closing date.
- An editable field does not fix this unless the UI forces verification. Editability without friction is how wrong data becomes “confirmed.”

If your Build screen paints extracted fields as already-complete checkmarks (the current brief’s complete/tick language), you inherit the worst of both worlds: the *appearance* of certainty plus the *absence* of review.

You need an explicit uncertainty model (found / unclear / missing — you already have status enums in extraction schema) rendered as **provisional**, not as done. Otherwise Monday’s demo with a slightly messy PDF will look more dangerous than today’s empty ticks.

### 4. Three products that already do chat + live document

| Product | What they get right | What you will probably get wrong |
| --- | --- | --- |
| **Cursor** | Chat is a *tool against a source of truth* the user already owns; the editor is primary; diffs make changes legible and reversible. | You will make chat primary in muscle memory (composer gravity) while claiming the brief is primary — users will still talk to the box and ignore the panel, like today. |
| **ChatGPT Canvas / Claude Artifacts** | The artifact is clearly a *draft object* with versions; the chat narrates edits; user always knows which pane is authoritative. | You will blur authority: chat says one thing, brief shows another, recap invents a third title — silent rename already exists in this codebase. |
| **Notion AI (page + chat)** | The page remains a normal document: every block is obviously editable; AI is invited in, not the container. | You will ship a “brief” that looks like progress UI (ticks, 4/7) instead of an editable record — same disease as `intake-brief-panel.tsx`, new paint. |

Honorable mention: **Harvey / CoCounsel-style** workspaces — document in, structured matter out, lawyer in the loop. They win on **citation and provenance** (“this field came from page 2”). Your plan currently has no provenance story. Without “source: PDF p.3 / chat / default,” editable fields are just a form.

### 5. What other candidates will build — and whether yours is different

Three obvious solutions to this brief:

1. **Chat-first scripted intake + show values in the existing brief** (patch today’s product). Same screens, fill in the blanks, add edit-on-click. Lowest effort; Mondays love “you fixed the audit.”
2. **Upload-first analyze → confirm fields → quote** (document wizard, minimal chat). One column, review table, submit. Very “AI legal” 2025.
3. **Short form with smart defaults** (3–5 fields, optional file, price). Anti-chat. Brutal and shippable.

**Your plan is closest to (1) dressed in (2)’s rhetoric.** Dual-pane Build is the industry-default “AI workspace” layout. Document-does-the-work is (2). Price-before-submit is the one sharp product edge.

Honest difference test:

- If Monday can tell your Build screen from “Cursor for intake” without reading the price, you are not differentiated.
- If the demo path is *upload PDF → brief fills → edit one field → see price → send*, you are meaningfully closer to (2) and harder to dismiss.
- If the demo path is *chat through matter chips while the brief ticks*, you built a better (1) and should admit it.

### 6. Three design decisions with low value (cut to protect time)

1. **Word-by-word streaming and fake “Thinking…” theatre.** High cost, actively harms first impression in the current product. Static competent replies beat shimmer.
2. **Lawyer carousel / social-proof on Sent** (especially with the known ID mismatch). Reviewers care about the brief and the price, not rotating headshots.
3. **Parity with the old matter-chip taxonomy and six commercial flows on day one.** One or two matter paths + “something else” beats six empty nouns. Taxonomy is a content project, not a weekend differentiator.

Honorable cut: voice/mic. It is already a lie in the current composer.

### 7. Single most likely reason the prototype fails to impress on Monday

**The demo still feels like the current product: a chat column with an under-fed sidebar, plus a price sticker.**

Failure mode in one sentence: extraction is weak or off, the brief stays label-heavy or confidently wrong, the dual pane looks empty or fake, and the price is obviously hardcoded — so the thesis (“document does the work, brief is the product”) is never visible in the room.

Second place, almost tied: **you reuse the foundation fork of MessageScroller/Composer and the first screen is still a void with “Thinking…”** — reviewers who already saw the audit will smell inheritance in the first five seconds.

---

## PART B. UI traps you will inherit

Assumption: you will reuse the visual language and many of the same primitives. The live flow imports heavily from `components/design/foundations/` and `design/intake/chat/`, **not** always from `packages/ui`. That fork gap is itself a trap (see §8–10).

For each item: what the code does → where the problem lives → what to do instead.

### 8. Scrolling

**What it does today.** The transcript uses foundation `MessageScrollerViewport` with `overflow-y-auto` and **no** `mz-scrollbar-on-scroll` (`foundations/components/message-scroller.tsx` ~75). The docked brief Sheet/Drawer body uses raw `overflow-y-auto` (`intake-chat-shell.tsx` ~140, ~175). Recap card body scrolls with `overflow-y-auto` (`intake-message.tsx` ~604). Playground composer textarea grows then scrolls without the on-scroll treatment (`intake/chat/chat-composer.tsx` ~309).

**Shared vs flow.** Mostly **shared (fork)**. `packages/ui` message-scroller and chat-composer already apply `mz-scrollbar-on-scroll` (hide until scroll). The live intake imported the fork that dropped it.

**Do instead.** Build on `@repo/ui` MessageScroller/ChatComposer, or copy `mz-scrollbar-on-scroll` + `useScrollActivity` into every overflow surface you touch. Do not add a fifth untreated `overflow-y-auto` on the brief.

### 9. File input

**What it does today.** Conversational attach inputs are `type="file" multiple` with **no `accept`** (`intake-message.tsx` AttachCard ~508–514; playground `chat-composer.tsx` ~346–352). `toIntakeFiles` keeps `{id,name,size}` only — no type/size validation (`file-utils.ts` ~24–29). The older `document-upload-zone.tsx` *does* use `accept={'.pdf,.doc,.docx,image/*'}` — proof the restriction existed and was not carried into the live path.

**Shared vs flow.** **Both.** Shared composers don’t constrain types; this flow never added rejection UI.

**Do instead.** Set `accept` on every file control to PDF/DOC/DOCX/images. Validate again in the change/drop handler (MIME + extension). Put the rejection in an inline banner **next to the drop target** (not a toast that vanishes) — the old zone’s Banner pattern is the right place. Never silently dock a rejected file as `done`.

### 10. Drag and drop

**What it does today.** Only the documents-step `AttachCard` handles drop (`intake-message.tsx` ~378–394). Playground `ChatComposer` has **no** drag handlers — dropping a file on the composer can let the browser navigate to the file. `packages/ui` ChatComposer *does* claim file drags (`preventDefault` on dragover) — unused by the live flow. Drop on transcript/shell/brief: unmanaged.

**Shared vs flow.** **Shared fork gap + flow.** You will “reuse ChatComposer” and accidentally pick the wrong one.

**Do instead.** Use `@repo/ui` ChatComposer (or port its drag claim). Smallest whole-page drop target: one document-level `dragenter`/`dragover`/`drop` on the Build/Start layout that calls the same ingest function as the paperclip, with a full-screen drop overlay. Depth-count dragenter/leave (packages/ui already does) so nested leaves don’t flicker.

### 11. Loading and waiting

**What exists.** Fake opening `Thinking…` 650ms (`conversational-intake-flow.tsx` + `typing-indicator.tsx`). Per-turn thinking same pattern. StreamingText word drip (34ms/word, max 1400ms) before chips appear. AI turn up to 12s then **silent** script fallback. Submit “Submitting…” ~900ms stub. Attachment can show uploading/processing shimmer in the composer API, but intake marks chips `done` immediately. Voice shows “Listening” then pastes a hardcoded sample transcript.

**Visibility.** Thinking marker is easy to miss (`text-sm text-muted-foreground` + shimmer). Streaming delay before chips is long and unexplained. AI failure is invisible.

**Shared vs flow.** Indicator component is shared; **timing and fakery are flow choices**.

**Do instead.** No thinking before user input. No fake delays. If extraction runs, show a single explicit progress state on the brief (“Reading PDF…”) with timeout and failure copy. Never fail open into a normal reply without saying the AI path died.

### 12. Empty space

**What it does.** `IntakeChatShell` is `h-full` flex: transcript region `flex-1 min-h-0`, composer pinned. First paint = empty scroller + delayed greeting → large dead vertical field.

**Shared vs flow.** **Shared shell layout**, exacerbated by flow’s empty initial messages + delayed hydrate.

**Do instead.** Start screen should not use the chat-shell flex void. Use a centered Start composition (problem + drop zone + CTA). Only mount the dual-pane shell once Build begins. Do not “fix” empty space by stretching a blank MessageScroller.

### 13. Text and contrast

Recurring pattern: **`text-[11px]` + `text-muted-foreground`** (and `/80`, `/40`) for eyebrows, counters, recap dts, submitted card labels (`intake-brief-panel.tsx` ~95–100; `intake-message.tsx` ~609; `case-submitted-card.tsx` ~140). Helper copy at `text-xs text-muted-foreground`. Thinking label same muted token.

**Shared vs flow.** Tokens are shared (`muted-foreground`); **choice to put critical progress/status in 11px muted caps is flow/foundation habit.**

**Do instead.** Body and field values at `text-sm` / foreground. Reserve 11px uppercase for true metadata. Never put the only price or the only error in `text-muted-foreground`.

### 14. Focus and keyboard

Enter submits (composer). While `busy`, send becomes Stop and blocks new send in the playground composer. Chips appear only after streaming — keyboard users wait. Chip buttons lock after selection. Case title uses click-to-edit `contentEditable` InlineField, not a focusable textbox until clicked. Desktop brief Sheet is `modal={false}` with outside interact prevented — focus can wander; Escape behavior is easy to get wrong. Leave dialog: primary actions only; cancel via Escape/outside.

**Can the flow be completed by keyboard today?** Partially, with friction — not cleanly end-to-end without fighting chip delay and title editing.

**Shared vs flow.** Composer keyboard is shared; **card gating, busy lock, InlineField, Sheet modal=false are flow/shell.**

**Do instead.** All primary actions as real `<button>`/`<input>`. Brief fields as proper inputs from the start. Do not disable the whole composer for cosmetic thinking. Ensure dropzone and file button are keyboard reachable. Test Tab order on Start → Build → Send before Monday.

### 15. Silent state changes

| Change | User told? |
| --- | --- |
| localStorage autosave (300ms debounce, “fail silently”) | No |
| “Save as draft” toast | Misleading — already saved |
| Derived / AI title into header and recap | No announcement |
| AI `extractedAnswers` merging into state | Brief ticks jump; values not shown in brief |
| AI summaries swapping recap text | No cue |
| Attachments reduced to metadata (bytes discarded) | No |
| Voice → canned transcript | No |
| AI error → scripted reply | No |

**Shared vs flow.** Persistence helpers are flow; Attachment “done” semantics are shared patterns misused by flow.

**Do instead.** If the brief is the product, **every field change needs a visible cause** (user typed / from PDF / suggested). No silent title rename. Autosave can be quiet only if status says “Saved” somewhere persistent. Never toast “Saved” for a no-op.

### 16. Truncation

`AttachmentTitle` / `AttachmentDescription` use `truncate` in both foundation and `@repo/ui` attachment components. Composer dock cards `max-w-56`. User bubble attachments `w-40` + truncate. Long user text `line-clamp-[10]`. Derived titles slice party names to 48 chars (`extract.ts`). Lawyer first names `truncate` on submitted card.

**Shared vs flow.** **Truncation is mostly shared Attachment + flow layout widths.**

**Do instead.** On the brief (your main screen), **do not truncate field values** — wrap. Truncate filenames in chips only, with full name in `title`/aria. Never truncate the price or the case title on Send.

---

## PART C. Closing

### The five mistakes I am most likely to repeat

Ranked by how fast they kill Monday:

1. **Shipping chat-primary gravity while claiming brief-primary.** Composer at the bottom will still own attention; the brief stays a side quest (today’s failure mode with better copy).
2. **Importing the foundation fork** (MessageScroller without on-scroll scrollbar, ChatComposer without drag claim, no `accept`) and calling it “reusing the design system.”
3. **Confident extraction into tick-complete fields** without provisional/uncertain states — wrong PDF demo becomes a trust demotion.
4. **Fake waiting** (Thinking…, streaming gates, silent AI fallback) — reviewers who read the intake audit will call it instantly.
5. **Document-as-hero with no first-class no-file path** — half the self-serve audience gets an empty-looking Build and the thesis never shows.

### Cut list

Drop first if Sunday runs out of time:

1. **Voice / mic** — already dishonest; zero demo value.
2. **Lawyer carousel / pod on Sent** — broken IDs, off-thesis.
3. **Word-by-word streaming + opening Thinking theatre** — spend the time on extraction → editable brief → price.
4. **Full six-matter taxonomy** — ship one vertical + Other.
5. **Pixel-perfect parity with every dashboard chrome flag** — freeze Start / Build / Send / Sent; ignore sidebar experiments.

**Keep under time pressure:** Start that works with or without a file; Build where every field shows a value and is editable; visible extraction uncertainty; price on Send; no silent renames; `@repo/ui` composer/scroller (or explicit ports of drag + scrollbar behavior).

---

## Bottom line

Your thesis is a sharp critique of a **transparency** failure. The shipped product’s bigger failures are **fake intelligence, unforgiving routing, and a brief that is not a document.** If you build “Canvas for intake” without making the brief obviously authoritative, provisional-when-extracted, and useful without a PDF, you will present a prettier version of the obvious candidate — and Monday will smell the inheritance in the scrollbar, the drop target, and the empty first pane.
