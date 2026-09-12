# Audit v2 — Code and build prep

**11 September 2026**

Second pass, run after the client confirmed the flow is being replaced rather than fixed.

---

## How to read this

v1 (`notes/intake-audit.md`) asked *what does a client suffer?* This pass asks *what can I build on tomorrow morning?* It is a code and capability audit: import paths, endpoint contracts, type shapes, and the specific traps that eat an afternoon. v1 is not superseded — §7 lists exactly what is new, sharpened, or contradicted.

Confidence is marked throughout:

- **Verified** — I opened the file, or ran the command, and quote the result.
- **Verified ×2** — an investigating agent found it and an adversarial verifier re-proved it against the installed typings.
- **Unverified** — stated from documentation or framework behaviour, not provable from this repo. Treat as probably-true.

One global caveat that shapes everything below: **there are three near-duplicate component trees and two parallel intake implementations.** Most of the cost of tomorrow is picking the wrong copy. §1 names which copy is live, every time.

### The live route, end to end (verified)

```
app/[locale]/(dashboard)/client/new/page.tsx:13
  └─ components/design/intake/intake-entry.tsx:28   if (flags.useSimplifiedMatterIntake)
       └─ components/design/new-case/conversational-intake-flow.tsx   ← THE LIVE FLOW
```

`useSimplifiedMatterIntake` defaults **true**, so this is what users get. `useAiCaseIntake` defaults **false**, so no AI runs by default.

**`UnifiedIntakeFlow` has zero importers** (verified: `grep -rn UnifiedIntakeFlow` returns only its own `export function` at `unified-intake-flow.tsx:48`). Everything reachable only through it — `intake-flow.tsx`, `QuestionDock`, `DocumentUploadZone`, `SummaryFieldRow`, `ReviewSummary`, `IntakeProgressPanel`, `GeneratingScreen`, `ChatMessage` — is dead code. It compiles, it typechecks, it renders nowhere. Editing it produces no visible change and no error.

---

## 1. Reusable parts

### 1a. The live/dead map for `design/intake/chat/` (verified)

This directory is half-live, which is why it is dangerous. Per-file importer check:

| File | Status | Reached by |
|---|---|---|
| `chat/chat-composer` | **LIVE** | `conversational-intake-flow.tsx:14` + 5 other surfaces |
| `chat/typing-indicator` | **LIVE** | `conversational-intake-flow.tsx:15` |
| `chat/streaming-text` | **LIVE** | via `new-case/intake-message.tsx` |
| `chat/collapsible-message-text` | **LIVE** | via `intake-message.tsx` + case-chat, sidebar-chat, support-chat |
| `chat/moritz-avatar` | **LIVE** | via `intake-message.tsx` |
| `chat/user-avatar` | **LIVE** | via `intake-message.tsx` |
| `chat/voice-waveform` | **LIVE** | via `chat-composer` |
| `chat/chat-message` (`ChatMessage`) | **DEAD** | 3 importers, all inside `UnifiedIntakeFlow` |
| `chat/message-attachment` | **DEAD** | **zero importers anywhere** |

**The live transcript row is `AssistantTurn` / `UserTurn` in `components/design/new-case/intake-message.tsx`**, not `ChatMessage`. An earlier draft of this audit got that backwards; the import graph settles it (`conversational-intake-flow.tsx:21`).

That said, *dead does not mean useless for a replacement flow.* The trade is real and you should pick deliberately:

- `intake-message.tsx` carries the **actual shipped visual language** (the multi-attachment row with `+N` overflow at `:73-98`, `CollapsibleMessageText` on user text) but is **welded to the engine you are deleting** — it imports `script.ts` and `intake-types`, and `RecapCard` walks `orderedQuestions()`. **Fork it for markup; do not import it.**
- `ChatMessage` is **unmounted but clean** — its only type import is a local 10-line `chat/types.ts`. That makes it the better *structural* base, at the cost of being unproven in the live tree. Its `stream` prop routes into the broken `StreamingText` (see §1c).

### 1b. Component inventory

Import paths are exactly what you type. `@/*` → app root; `@repo/ui/*` → `packages/ui/src/*`.

| Need | Use | Import path | Verdict |
|---|---|---|---|
| **Chat transcript** — scroll container | `MessageScroller*` | `@/components/design/foundations/components/message-scroller` | drop-in |
| **Chat transcript** — page frame | `IntakeChatShell` | `@/components/design/intake/components/intake-chat-shell` | adapt |
| **Chat transcript** — bubble | `Bubble`, `BubbleContent` | `@/components/design/foundations/components/bubble` | drop-in |
| **Chat transcript** — row (live) | `AssistantTurn`, `UserTurn` | `@/components/design/new-case/intake-message` | fork for markup |
| **Chat transcript** — row (clean/dead) | `ChatMessage` | `@/components/design/intake/chat/chat-message` | adapt |
| **Chat transcript** — avatars | `MoritzAvatar`, `UserAvatar` | `@/components/design/intake/chat/moritz-avatar`, `.../user-avatar` | drop-in / adapt |
| **Chat transcript** — long-text clamp | `CollapsibleMessageText` | `@/components/design/intake/chat/collapsible-message-text` | drop-in |
| **Chat transcript** — inline status rows | `Marker`, `MarkerContent` | `@/components/design/foundations/components/marker` | drop-in |
| **Composer w/ attachments** (recommended) | `ChatComposer` | `@repo/ui/components/chat-composer` | adapt |
| **Composer w/ attachments** (incumbent) | `ChatComposer` | `@/components/design/intake/chat/chat-composer` | adapt |
| **Composer** — attachment cards | `Attachment*`, `AttachmentGroup` | `@/components/design/foundations/components/attachment` | drop-in |
| **Composer** — big findable actions | `ComposerActions`, `ComposerAction` | `@repo/ui/components/composer-actions` | drop-in (unused in app) |
| **Streaming text** | `StreamingText` | `@/components/design/intake/chat/streaming-text` | **rewrite — see §1c** |
| **Streaming text** — markdown | `MarkdownContent` | `@repo/ui/components/markdown-content` | drop-in (real `streaming` prop) |
| **Streaming text** — waiting state | `TypingIndicator` | `@/components/design/intake/chat/typing-indicator` | adapt (hardcoded copy) |
| **File drop zone** (live, robust) | `FileDropzone` | `@/components/shared/file-dropzone` | adapt (hard i18n dep) |
| **File drop zone** (dead) | `DocumentUploadZone` | `@/components/design/intake/components/document-upload-zone` | reference-only |
| **File drop zone** — drop mechanics to copy | `ChatComposer` | `@repo/ui/components/chat-composer` | reference-only |
| **File drop zone** — empty-state shell | `Empty*` | `@repo/ui/components/empty` | drop-in |
| **Editable inline field** | `EditableValue` | `@/components/design/tabular-playbook/components/EditableValue` | **drop-in — has Save/Discard** |
| **Editable inline field** (minimal) | `InlineField` | `@/components/design/playbook-studio/inline-field` | adapt (Enter/blur commit only) |
| **Badge / state marker** | `Badge`, `BadgeButton` | `@repo/ui/components/badge` | **drop-in — the right choice** |
| **Card** | `Card`, `CardHeader`, `CardContent`, … | `@/components/design/design-system/card` | drop-in |
| **Primary button** | `Button`, `buttonVariants` | `@/components/design/design-system/button` | drop-in |
| **Status** — spinner | `Spinner` | `@/components/design/foundations/components/spinner` | drop-in |
| **Status** — skeleton | `Skeleton` | `@repo/ui/components/skeleton` | drop-in |
| **Progress** — step dots | `OnboardingProgressDots` | `@/components/design/onboarding/onboarding-progress` | adapt (module-global bug) |

**Button** (verified — the canonical intake path; 19 intake files use it, 0 use `@repo/ui/components/button`). `@/components/design/design-system/button` is a 10-line re-export shim over `foundations/components/button`, kept as a stable path. Full API:

- `variant`: `default | secondary | destructive | outline | ghost | link`
- `size`: `sm | default | lg | xl | 2xl | icon-sm | icon | icon-lg`
- plus `asChild`, `isPending`

**Badge is the only primitive that can express confirmed / inferred / missing** (verified ×2). Eight variants: `default | secondary | destructive | success | warning | info | accent | outline`, sizes `default | lg`. The two lookalikes cannot do the job:

- `Marker` — every variant is muted grey (`flex items-center gap-2 text-sm text-muted-foreground`); no state palette. Use it as the *row* a Badge sits in.
- `Chip` — only `outline | ghost`, both neutral, and it is a focusable `<button>`. Wrong semantics for a read-only field marker.

Badge is light-only and hardcodes raw Tailwind palette rather than semantic tokens — a dark mode would need work.

### 1c. What you must build yourself

1. **A streaming-text renderer that consumes a real stream.** `StreamingText` is a typewriter over a *finished* string. Its effect's only dependency is `[text]` (`streaming-text.tsx:79`) and its body begins `setCount(0)` (`:63`), so every token that extends `text` restarts the reveal from word one. ~40-line rewrite: hold the revealed count in a ref, reset only when the new text is *not* a prefix-extension of the old, and advance toward the live length. **Verified ×2.**
   - Correction to v1: `MAX_DURATION_MS = 1400` is a **floor**, not a cap — `Math.max(34, floor(1400 / totalWords))` means ≤41 words takes 1400 ms and longer replies grow unbounded (~300 words ≈ 10 s). The file's own comment says "floor."
2. **A client stream reader.** Nothing in the app reads a stream. `grep` for `getReader()|EventSource|fromReadableStream` across `components`, `lib`, `app` and `packages` returns **one** hit — the route's own `Content-Type` line. This is new work, not a refactor. **Verified ×2.**
3. **A progress / stepper primitive.** None exists. No `progress*` or `step*` file in 50 `@repo/ui` components, no `@radix-ui/react-progress` in any `package.json`. Progress is hand-rolled nine times. `OnboardingProgressDots` is the only generic one and it holds **module-scoped mutable state** (`let lastRenderedStep: number | null = null`, `:17`) — render two and they fight.
4. **Per-file upload/extraction progress.** Every existing affordance is indeterminate. The one percent bar (`UploadProgressDialog`) is a modal, aggregate-only, and uses off-token colours (`bg-gray-200` / `bg-blue-600`).
5. **A drop zone whose target is the whole zone.** `DocumentUploadZone` puts handlers on the inner dashed box only (`:76-81`); the file list and padding are siblings under a handler-free wrapper (`:65`), so a file dropped there is handled by the **browser, which navigates away from the in-progress intake**. The correct guards already exist in `@repo/ui/components/chat-composer:379-410` (a `types.includes('Files')` check, a `dragDepth` counter, unconditional `preventDefault` on `dragOver`).

**Not gaps** — these exist, contrary to a first read:

- Click-to-edit **with Save/Discard**: `EditableValue` (`design/tabular-playbook/components/EditableValue`) — its docstring is literally "read as text or chips, click to edit in place, Save or Discard to finish," and it holds the uncommitted value in local draft state.
- A transcript that takes a messages array: 20–30 lines mapping your array inside the shell's `children`.

---

## 2. The extract endpoint — the most important answer

**`/api/extract` is the one correct, current-API Anthropic call in this repository. It works. It has never been executed.**

`apps/legal-intake-design/app/api/extract/route.ts` — `POST` only, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.

### Accepts (verified)

JSON body only — `await request.json()` at `:159`. **There is no multipart path anywhere in the repo.**

```ts
{
  messages: MessageParam[],   // required, non-empty
  documents?: string[]        // raw base64 PDFs — NO data-URL prefix
}
```

Validation is hand-rolled (`:54-68`) and shallow: `role` must be `'user' | 'assistant'` and `content` must be a string or *any* array — **inner content blocks are never inspected**. `documents` entries are checked only for `typeof === 'string' && length > 0`. The "raw base64, no data-URL prefix" contract exists **only as a JSDoc comment at `:25`** and is enforced nowhere.

### Returns (verified)

- **200** — the bare `IntakeExtraction`, no envelope: `{ matterType: string, fields: { key, value, source, status: 'found'|'missing'|'unclear' }[] }`
- **400** ×2 — invalid JSON (`:161`), bad body shape (`:166`)
- **500** ×4 — no text content (`:202`), non-JSON text (`:212`), schema mismatch (`:220`), catch-all echoing the raw upstream message (`:229`)

This is **the only Anthropic route in the repo with honest status codes.** Its sibling `/api/ai-intake` returns HTTP 200 `{ok:false}` for every failure. Two routes, opposite error conventions — a shared client cannot treat them alike.

### PDFs — yes (verified ×2)

`toDocumentBlock` (`:70-79`) builds exactly:

```ts
{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf } }
```

This matches the installed SDK byte-for-byte: `Base64PDFSource` (`messages.d.ts:100-104`) and `DocumentBlockParam.source` (`:1772-1774`). No beta header needed. Blocks are **prepended** before existing content of the last user message (`:104-107`); if the last message is not a user turn, a fresh one is appended (`:92-95`).

`media_type` is **hardcoded** `'application/pdf'` for every entry (`:75`) — no allow-list, no magic-byte check, no extension check. A base64 PNG becomes a document block claiming to be a PDF, which the API rejects with a 400 that this route relays as a 500.

### Does it work today? Yes — with one live defect

Every item checked against the **installed** SDK (`@anthropic-ai/sdk` **0.125.0**), not from memory:

1. **It typechecks.** I ran `npx tsc --noEmit -p tsconfig.json` in the app: **exit 0, zero diagnostics**, under `strict` + `noUncheckedIndexedAccess`. That specifically proves the `as const` readonly schema is assignable to `JSONOutputFormat.schema: { [key: string]: unknown }` — the one non-obvious risk. **Verified independently, twice.**
2. **The structured-output parameter is the current spelling.** `:190-195` passes `output_config: { format: { type: 'json_schema', schema } }`. Confirmed against `OutputConfig` (`messages.d.ts:2065-2075`) and `JSONOutputFormat` (`:1847-1855`). The deprecated `output_format` appears nowhere in the repo — it survives only on the SDK's beta namespace, explicitly marked *"Deprecated: Use output_config.format instead."*
3. **The JSON schema is valid.** Root `type: 'object'`; `required` covers 100% of properties at both levels; `additionalProperties: false` on root (`schema.ts:45`) and on the nested item (`:40`); only supported keywords (object/array/string/enum). No recursion, no `minLength`/`maximum`.
4. **The model ID is correct and must not be "cleaned up."** `EXTRACTION_MODEL = 'claude-haiku-4-5-20251001'`. The **date suffix is required**: the supported-model list for structured outputs contains `claude-haiku-4-5-20251001` and **not** the undated `claude-haiku-4-5`. A well-meaning tidy to the short form **breaks structured outputs.** Leave it. *(Verified against the structured-outputs documentation; the ID also appears in the SDK's `Model` union at `messages.d.ts:2064`.)*
5. **The response read path is right in principle.** Under structured outputs the JSON arrives in a `text` block, so `textFromMessage` + `JSON.parse` is the correct shape.
6. **The API key resolves.** `new Anthropic()` reads `ANTHROPIC_API_KEY`, present in `.env.local`. A missing key does not crash: the SDK throws on first *use*, inside the `try`, so it degrades to a 500.
7. **Cache breakpoints are legal** — one, on a system text block, well under the max of 4.

### What is missing — precisely

| # | Severity | Defect |
|---|---|---|
| 1 | **degraded** | `max_tokens: 1024` (`:181`) against an **unbounded** `fields` array of 4 strings each. A real PDF plausibly yields 10–25 fields ≈ 300–1500 output tokens. On overflow the API returns 200 with `stop_reason: 'max_tokens'` and truncated JSON; the route **never reads `stop_reason`** (`grep` returns nothing) and goes straight to `JSON.parse` at `:210`, which throws → misleading 500 *"Model returned non-JSON text."* The same message also masks a genuine `refusal`. Haiku 4.5's output ceiling is 64K, so 1024 is ~1.6% of what is available. **Fix:** raise to 8192 and guard `stop_reason` before parsing. |
| 2 | **degraded** | No normalisation of `documents`. **And the repo's obvious helper is a trap:** `lib/image-utils.ts:44` is named `fileToBase64` but calls `readAsDataURL` (`:61`) and resolves a full `data:` URI. Wiring the route with it POSTs `"data:application/pdf;base64,JVBERi0…"`, the prefix is forwarded as PDF bytes, and Anthropic 400s → relayed as an opaque 500. Same for base64 containing newlines. **Fix:** strip a leading `data:` header, strip whitespace, verify the decoded bytes start with `%PDF-`, and 400 with a specific message. |
| 3 | **degraded** | No size or page guard. Base64 inflates ~33%. The Messages API caps a request at **32 MB**, and PDF page limits are **600 pages generally but 100 on 200K-context models** — Haiku 4.5 is a 200K model, so **100 pages is the real ceiling**. Nothing caps count or size. *(Limits from Anthropic's document-input reference; one verifier could not source them locally and flagged them — they are documented, and I am keeping them.)* Note `next.config.js`'s `serverActions.bodySizeLimit: '15mb'` does **not** govern route handlers. |
| 4 | **degraded** | `parseBody` accepts message arrays the API rejects: no check that `messages[0].role === 'user'`, and `withDocuments` returns early when `documents` is absent (`:85`), so a conversation ending on an `assistant` turn is forwarded as a **prefill — which is incompatible with structured outputs.** The failure appears *only* when no documents are attached, so it reads as flaky. |
| 5 | cosmetic | The cache breakpoint is a **guaranteed no-op**: it sits on a ~45-token system prompt, and Haiku 4.5's minimum cacheable prefix is 4096 tokens. It writes nothing, reads nothing, silently, forever. Meanwhile the document blocks — which dominate the bill — carry no breakpoint. Either delete it or move it to the last document block. |
| 6 | cosmetic | `:229` returns raw upstream error text to any caller, including the SDK's internal *"Could not resolve authentication method…"* when unconfigured. |
| 7 | **degraded** | **Zero callers.** Nothing in the repo POSTs here. |

### The name collision (verified)

`components/design/new-case/extract.ts` is **completely unrelated** to this route — no HTTP, no Anthropic import. It exports pure string helpers (`deriveTitle`, `deriveCaseTitle`, `estimateTurnaround`) and has three real importers. Pure coincidence, and an active trap.

---

## 3. The AI routes

### `/api/ai-intake` — the only one that is wired

`app/api/ai-intake/route.ts` → `ai/anthropic-intake.ts`. Client: `ai/ai-intake-client.ts:14` (`ENDPOINT = '/api/ai-intake'`), called from `conversational-intake-flow.tsx`.

- Body is a discriminated `{task: 'turn' | 'recap', …}` — **nothing is validated**, the body is cast.
- **Always HTTP 200.** Every failure — missing key (`:21-23`), unparseable JSON (`:29`), unknown task (`:41`), any throw (`:43`) — returns `{ok: false}` at 200. No non-200 status exists in the file.
- Not streaming: blocking `Response.json`, client does `await response.json()`. The UI shows a typing indicator for up to `AI_TIMEOUT_MS = 12000`.
- Works? **Unknown — needs a runtime test**, and by construction you cannot tell from the outside.

### `/api/intake` — streams, but the header lies

**This is the highest-value finding in §3.** `:69` declares `'Content-Type': 'text/event-stream; charset=utf-8'` over `stream.toReadableStream()` (`:67`). That method emits **newline-delimited JSON** — `JSON.stringify(event) + '\n'` (SDK `core/streaming.mjs:226`). There is **no `data:` prefix, no `\n\n` terminator, no `[DONE]` sentinel.**

So: the route flushes genuinely incrementally (it does *not* accumulate), the bytes are correct, the status is 200 — and **every SSE client reads zero events**, because each line fails SSE field parsing and is discarded silently. **Verified ×2.** Model is `claude-sonnet-5`, `max_tokens: 2048`. Zero callers.

### The simplest path to a streaming Claude reply

**Build on `/api/intake`.** It is ~90% right: nodejs runtime, `force-dynamic`, real incremental flushing, caching wired. Three defects: mislabelled wire, no error frame, no client.

**`EventSource` is ruled out** — it is GET-only with no body, and this route must POST a `messages` array. Use `fetch` + `res.body.getReader()`. The `pg_unlocked` cookie rides along on a same-origin fetch automatically.

**Option A — smallest diff (recommended).** Change `:69` to `'application/x-ndjson'`, drop the hop-by-hop `Connection` header, add `'X-Accel-Buffering': 'no'`. Then let the SDK parse its own frames:

```ts
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

const res = await fetch('/api/intake', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ messages }),
});
if (!res.ok || !res.body) throw new Error(`intake ${res.status}`);

const s = MessageStream.fromReadableStream(res.body);
s.on('text', (delta) => setText((t) => t + delta));
s.on('error', (e) => setError(e.message));   // makes failures visible
await s.finalMessage();
```

No framing code, and a real error callback. Cost: the client couples to the SDK's event shape.

**Option B — real SSE.** Replace `toReadableStream()` with a manual `ReadableStream` emitting `event: delta\ndata: {...}\n\n`, plus explicit `done` and `error` events; wire `request.signal` to `stream.abort()`. More code, framing-agnostic wire, and you control exactly what reaches the browser.

Either way: raise `max_tokens` above 2048, replace the placeholder system prompt at `lib/intake/system-prompt.ts:5-6` (its own comment says *"Placeholder — replace with the real intake instructions later"*), and render tokens by passing the accumulating string as `children` with **`stream={false}`** — never through `StreamingText`.

---

## 4. File handling — where the bytes die

### The primary discard point (verified ×2)

**`apps/legal-intake-design/components/design/new-case/file-utils.ts:24-30`**, decisively lines 25-29:

```ts
export function toIntakeFiles(list: FileList | File[]): IntakeFile[] {
  return Array.from(list).map((f) => ({
    id: newId(),
    name: f.name,
    size: f.size,
  }));
}
```

The arrow parameter `f` is **the last reference to the `File` anywhere in the live flow**, and it goes out of scope on return. Survives: `id`, `name`, `size`. Lost: the `File` itself and therefore every byte — plus `.type`, `.lastModified`, `.arrayBuffer()`, `.stream()`, `.slice()`.

The structural cause is one type below it — **`intake-types.ts:37-41`**:

```ts
export interface IntakeFile { id: string; name: string; size: number; }
```

There is nowhere to *put* bytes even if you kept them. `toIntakeFiles` has exactly **one** consumer module (`conversational-intake-flow.tsx`, at `:364` and `:379`), which makes it a clean single point of change.

Downstream sites are consequences, not causes: `conversational-intake-flow.tsx:364` / `:379` hand live `FileList`s straight to `toIntakeFiles`; `use-intake-state.ts:123` `JSON.stringify`s the snapshot into `localStorage` (a `File` there would serialise to `{}` silently, and the failure is swallowed by an **empty catch** at `:124-126`).

The other implementation keeps MIME (`intake-flow.tsx:181-183` returns `{name, size, type}`) but is dead. And `mock-document-extraction.ts:66` takes a real `File` yet reads only `.name` and `.type` — its header says so: *"Deterministic, filename-driven… Nothing is uploaded anywhere."*

**No drop zone in this repo reads a single byte.** Repo-wide there is no `arrayBuffer`/`FileReader`/`readAsText` in any intake path.

### The smallest change

The server half already exists and is already correct — it is only never called. So this is **client-side only, zero server changes.** Three edits:

**Edit 1 — give the type a slot** (`new-case/intake-types.ts:37-41`):

```ts
export interface IntakeFile {
  id: string;
  name: string;
  size: number;
  /** Browser MIME type, so the send path can pick a block shape. */
  mediaType?: string;
  /** Raw base64 — no `data:` prefix, no newlines. PDFs only. */
  data?: string;
}
```

Both **optional**, so every existing construction site and the loose rehydrator at `use-intake-state.ts:84` keep compiling unchanged.

**Edit 2 — the discard site becomes an encoder** (`file-utils.ts`, replacing `:24-30`). Encode in the **browser**, because `/api/extract` is a JSON route handler expecting `documents: string[]` and no multipart parsing exists anywhere in the repo:

```ts
const B64_CHUNK = 0x8000; // 32k, so String.fromCharCode never blows the stack

/** Raw base64, no data-URL prefix and no newlines — what /api/extract wants. */
async function fileToRawBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += B64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + B64_CHUNK));
  }
  return btoa(binary);
}
```

…and make `toIntakeFiles` async, returning `{ id, name, size, mediaType: f.type, data }`, with a `f.size <= MAX_PDF_BYTES` gate and a `f.type === 'application/pdf'` check before encoding.

**Do not reuse `lib/image-utils.ts:44` `fileToBase64`.** It returns a `data:` URI. If you must, split on the comma — the idiom is already in that file at `:171`.

**Edit 3 — send them.** POST `{ messages, documents: files.map(f => f.data).filter(Boolean) }` to `/api/extract`.

### Which risks actually bite here

- **Base64 inflation (~33%) — bites, and is paid three times.** The same `IntakeFile` objects land in two state trees (`conversational-intake-flow.tsx:236` and `:240`) plus a request copy. A 6 MB PDF is ~8 MB of base64 held twice over. Mitigate with the size gate, and only ever read `f.data` from `files`.
- **The 100-page cap — bites, and is the tighter limit.** Haiku 4.5 is a 200K-context model, so 100 pages applies, not 600. Meanwhile both entry points are `<input type="file" multiple>` with **no `accept` and no size check** (`intake-message.tsx:508-514`). A client attaching a 300-page bundle gets a 400 with no UI to explain it. (For contrast the dead flow *does* constrain: `document-upload-zone.tsx:24` has `ACCEPTED = '.pdf,.doc,.docx,image/*'`, and `create-legal-case-form.tsx:45` has a 15 MB cap.)
- **A `File` through a JSON boundary — bites, silently.** `JSON.stringify(new File(...))` is `{}`. This is why `data` must be a string on the type, not a `File`.
- **Next.js body limits — does *not* bite, and looks like it does.** `next.config.js:15-19` sets `serverActions.bodySizeLimit: '15mb'`, which governs **Server Actions only**, not route handlers. So nothing upstream rejects a huge body to `/api/extract` — but if you reach for a Server Action instead (natural in Next 16 / React 19), 15 MB caps you, ≈11 MB of actual PDF. *(Framework behaviour — unverified from this repo.)*

---

## 5. State

### Today (verified ×2)

**One store is live, one is dead, and the dead one owns the resume banner.**

**LIVE — `use-intake-state.ts`**, used once by `ConversationalIntakeFlow`. `useState<IntakeSnapshot>` + `localStorage`, hydrate-once, **300 ms debounced write**. Not a reducer, not context.

**It persists.** Key: **`playground:new-case-intake:v2`** (`:12`), written `:123`, read `:61`.

| Survives a reload | Does **not** survive |
|---|---|
| `matterId` | **File bytes** — `{id,name,size}` only |
| all `answers` (flat `Record<string,string>`) | composer `pendingFiles` (`:94`) |
| `currentKey` (resumes on the same question) | typed `draft` (`:87`) |
| last **60** messages (`MAX_MESSAGES = 60` — older turns dropped permanently) | `aiDescriptionRef` (`:113`) — the Claude-written brief |
| `done`, `titleOverride`, `aiSummaries` | |

Two consequences worth designing against: after a reload the brief panel still shows the documents step **complete** (`intake-brief-panel.tsx:46` — `files.length > 0`), a green check over a filename with no content behind it; and reloading at the recap silently swaps the AI-written description for the deterministic `deriveDescription`. The live flow **never prompts for a re-upload**, though the dead implementation's own comment says it should (`intake/intake-types.ts:18-20`).

**DEAD — `use-intake-draft.ts`** + `ResumeBanner`, reachable only via `UnifiedIntakeFlow`. Its per-matter keys `playground:intake:<matterType>:draft:v1` are **never written in the running app**, and the "Pick up where you left off?" banner never renders. **A resume banner in the codebase does not imply resume on the live route.**

Also persisted, separately: `playground:new-case-created-titles:v1` (`created-cases.ts:8`) — last 50 titles, **never cleared by any code path**; and the flag map `playground:design-flags`, which decides which intake you get.

**Not present anywhere** (verified by grep): `sessionStorage`, IndexedDB, URL/`searchParams` state, and any `useReducer` in the intake.

The current answer type makes provenance **unrepresentable**:

```ts
export type AnswerValue = string;
export type AnswersMap = Record<string, AnswerValue>;   // intake-types.ts:19-22
```

…with `''` overloaded to mean "skipped" (`script.ts:141-143`). Model output and client answers land in the same map with nothing to distinguish them.

### The simplest shape that works

```ts
/** Where this field's current value came from. Discriminated on `kind`. */
export type FieldSource =
  | { kind: 'answered';  messageId: string; at: string }
  | { kind: 'extracted'; documentId: string; page?: number; quote?: string; model: string; at: string }
  | { kind: 'inferred';  from: string[]; model: string; at: string }
  | { kind: 'prefilled'; reason: 'default' | 'account'; at: string };

/**
 * Has a human signed off?
 *  confirmed   — the client said it, or clicked/edited to accept it
 *  unconfirmed — a value is present but only a machine put it there
 *  missing     — no value yet
 */
export type FieldConfidence = 'confirmed' | 'unconfirmed' | 'missing';

/** Generic, so one field can hold string | string[] | Date | null. */
export type Field<T> = {
  value: T | null;
  source: FieldSource | null;          // null iff confidence === 'missing'
  confidence: FieldConfidence;
  supersedes?: { value: T | null; source: FieldSource | null };  // one step of history
};

export type BriefValue = string | string[] | Date | null;

export type BriefDocument = {
  id: string;
  name: string;
  size: number;
  /** Live handle. Non-null ONLY in the session that uploaded it — a File is not
   *  JSON-serialisable, so after a reload this is null and the UI must re-ask. */
  blob: File | null;
  data?: string;                       // raw base64, for the send path
  status: 'pending' | 'extracting' | 'extracted' | 'failed';
  pageCount?: number;
};

export type CaseBrief = {
  id: string;
  version: 3;                          // bump to invalidate persisted briefs
  matterType: Field<MatterId>;
  title: Field<string>;
  fields: Record<string, Field<BriefValue>>;
  documents: BriefDocument[];
  transcript: { lastMessageId: string | null };   // reference, not a copy
  awaitingKey: string | null;
  submittedAt: string | null;
};

/** The three marker states the panel renders. Derived, never stored. */
export function markerFor<T>(f: Field<T>): 'confirmed' | 'inferred' | 'missing' {
  if (f.confidence === 'missing' || f.value === null) return 'missing';
  return f.confidence === 'confirmed' ? 'confirmed' : 'inferred';
}

/** "from page 3 of your contract" */
export function citationFor<T>(f: Field<T>, docs: readonly BriefDocument[]): string | null {
  const s = f.source;
  if (s?.kind !== 'extracted') return null;
  const doc = docs.find((d) => d.id === s.documentId);
  if (!doc) return null;
  return s.page ? `from page ${s.page} of ${doc.name}` : `from ${doc.name}`;
}
```

Why each decision:

- **`Field<T>` generic rather than a union per question kind** — one wrapper covers `string`, `string[]` and `Date`, and `Record<string, Field<BriefValue>>` keeps the key-addressed model the existing question walkers already use.
- **`value: T | null`** — kills the current three-way sentinel mess where `undefined` means unasked and `''` means skipped. `null` + `confidence: 'missing'` says it once.
- **`source` discriminated on `kind`** — the four origins are structurally different; a flat `source: string` (as in `lib/intake/schema.ts:11`) cannot carry a page number. The discriminant lets `citationFor` narrow with no casts.
- **`confidence` is about *human sign-off*, not model certainty** — this is the decision worth arguing. `unconfirmed` + `source.kind === 'extracted' | 'inferred'` **is** "the model guessed this and nobody has confirmed it," and it is exactly what should block submit. A numeric 0–1 score cannot drive a marker without an arbitrary threshold. Note `lib/intake/schema.ts:6` gets this wrong today by folding model certainty (`found`/`unclear`) into the same enum as state (`missing`).
- **`markerFor` derived, never stored** — the rendering can never drift from the stored truth.

Deliberately left out: numeric scores, multi-step history (one `supersedes` step is enough for "you changed this from X"), per-field validation rules, and a separate transcript copy.

**Reducer actions:** `answer(key, value, messageId)` → confirmed · `extract(key, value, documentId, page, quote)` → unconfirmed, **never overwriting a confirmed field** · `confirm(key)` → flips unconfirmed→confirmed, keeping `source` · `correct(key, value)` → confirmed, moving the old pair into `supersedes` · `invalidate(key)` → back to missing when a document is removed.

One invariant to enforce in the reducer rather than the type: `source === null` iff `confidence === 'missing'`.

---

## 6. The five things most likely to cost you hours

Ranked by expected time lost, weighting **time-to-diagnose** over severity — a loud crash is cheap; an error disguised as success is not.

### 1. The gate 401s your first curl, and the file that does it is not called `middleware.ts` — 30 min–2 h

**Cause:** `apps/legal-intake-design/proxy.ts:15-25` intercepts every `/api/*` path except `/api/gate` and returns `NextResponse.json({ok:false, error:'locked'}, {status:401})` unless a valid signed `pg_unlocked` cookie is present. **Next 16.3.3 renamed the middleware convention from `middleware.ts` to `proxy.ts`** — there is no `middleware.ts` in this app.

**Symptom:** every curl to `/api/extract` or `/api/intake` returns `401 {"ok":false,"error":"locked"}`. You conclude the route is broken, or that your body shape is wrong, and start editing a route that was fine.

**Why expensive:** searching for `middleware.ts` finds nothing, so the natural conclusion is "there is no auth here." One of this audit's own agents made exactly that mistake and reported the route as "completely unauthenticated."

**Detect:** `cat apps/legal-intake-design/proxy.ts` before your first request.

**Fix:** unlock via the UI and reuse the cookie (`curl -b cookies.txt`), or POST `/api/gate` first to mint it.

### 2. The streaming route returns 200, streams real bytes, and no SSE client can read them — 3–5 h

**Cause:** `app/api/intake/route.ts:69` declares `text/event-stream` over `stream.toReadableStream()` (`:67`), which emits newline-delimited JSON (`JSON.stringify(event) + '\n'`, SDK `core/streaming.mjs:226`).

**Symptom:** POST succeeds. Network tab shows 200, `Content-Type: text/event-stream`, connection open, bytes arriving. `EventSource` yields zero `message` events forever (and can never work — the route is POST-only). A hand-rolled `data:`-frame reader also yields nothing, because every line fails SSE field parsing and is **discarded silently**.

**Why expensive:** the header asserts a format the body does not have, and nothing contradicts it — TypeScript is silent (it's a string), the API is happy, the route has no error, and the bytes are correct. So the hunt starts on the client and stays there: buffering, proxies, `X-Accel-Buffering`, Turbopack, React strict mode.

**Detect:** look at the first byte of a line — `curl -sN -b cookies.txt -X POST localhost:3080/api/intake -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}' | head -3`. Lines starting `{"type":"message_start"` mean NDJSON and the header is lying.

**Fix:** pick one wire format and make both ends agree **before writing any client** — §3, Option A.

### 3. Every failure on the AI path reports HTTP 200, so broken is indistinguishable from working — 2–4 h

**Cause:** `app/api/ai-intake/route.ts` returns `{ok:false}` with no status on all four failure paths; `ai-intake-client.ts:27` collapses that to `null`; the flow falls back to the deterministic script.

**Symptom:** the intake appears to work. Everything is 200, nothing logs (`logAnthropicUsage` early-returns outside development), and the assistant replies — with scripted copy. A typo'd key, a 401, a 429, a wrong model ID, and "the model had nothing to add" are **byte-identical** from the browser.

**Why expensive:** the one signal a developer trusts most is actively wrong, and the fallback is designed to look like success. You will spend the afternoon tuning a system prompt to explain why replies feel generic — they are generic, because they are the script.

**Detect:** `grep -rn 'return null\|{ ok: false }' components/design/new-case/ai/ app/api/ai-intake/` to count the swallow points, then add one `console.error` in the catch and prove the path is live rather than inferring it.

**Fix:** real status codes on the new route (503 missing key, 400 bad body, 502 upstream), each with an `error` string. Keep the graceful UI fallback, but **log the reason and surface that it happened.**

### 4. You edit the richest-looking intake components and nothing changes — 2–4 h

**Cause:** `unified-intake-flow.tsx:48` has zero importers, so `intake-flow.tsx`, `QuestionDock`, `DocumentUploadZone`, `SummaryFieldRow`, `ReviewSummary`, `IntakeProgressPanel`, `GeneratingScreen` and `ChatMessage` are all unreachable. `message-attachment.tsx` has **zero importers at all**.

**Symptom:** you edit the component that obviously governs document upload, save, and the browser shows exactly what it showed before. No error, no warning. Then: hard refresh, `rm -rf .next`, restart, add a `console.log` that never prints, wonder whether Turbopack is broken.

**Why expensive:** there is no failure to diagnose, only **absence** — the hardest thing to search for. The directory is named `intake`, contains the most complete-looking intake UI in the repo, and nothing marks it as unmounted. It is also **half-live**, so neighbouring edits in `chat/` *do* work, which actively confirms the wrong mental model.

**Detect:** before editing anything, prove it renders — `grep -rn '<ComponentName' apps/legal-intake-design --include='*.tsx'`. One hit means one definition and zero mounts.

**Fix:** work only in the proven-live tree (§1a). Mine the dead files by **copying markup**, never by importing.

### 5. PDFs reach the model as nothing, and the obvious helper produces the one format the route rejects — 2–3 h

**Cause:** `file-utils.ts:24-30` drops the blob; `intake-types.ts:37-41` has nowhere to put it; and `lib/image-utils.ts:44` `fileToBase64` returns a `data:` URI while `/api/extract:25` documents "raw base64, no data-URL prefix."

**Symptom:** attach a PDF — the chip renders, the name shows, and `intake-brief-panel.tsx:46` puts a **green check on the documents step**. Extraction then returns nothing useful, or `500 {"error":"Model returned non-JSON text: {\"matterType\":\"contract\",\"fields\":[{…"}`.

**Why expensive:** three silent failures stacked, each masking the next. The blob is gone before you look and the UI says the step is complete, so the natural conclusion is "upload works, extraction is weak." When you do wire it, the in-repo helper named `fileToBase64` returns exactly the shape the route will not accept. And when that is fixed, `max_tokens: 1024` truncates and reports itself as a **model** problem.

**Detect:** `console.log(documents[0]?.slice(0, 32))` — if it begins `data:`, that is the bug. Server-side, assert `Buffer.from(d,'base64').subarray(0,5).toString('latin1') === '%PDF-'` and 400 with a specific message.

**Fix:** §4, Edits 1–3, plus raise `max_tokens` and guard `stop_reason`.

### Honourable mentions

- **Three near-duplicate component trees**, and one pair has actually **diverged**: `@repo/ui`'s `AttachmentMedia` accepts `icon` and `downloadable`; the foundations copy does not. Mixing parts across copies breaks at runtime (separate React contexts) or at typecheck.
- **The composer microphone fabricates client speech** — both copies paste a hardcoded `SAMPLE_TRANSCRIPT` on stop. The stub travels with the component you are most likely to adopt.
- **`max_tokens: 2048` on the stream route with thinking on by default** — Sonnet 5 runs adaptive thinking with `display` defaulting to `omitted`, so the first events carry empty thinking text and look like a stall.
- **`UserAvatar` ships a fictional lawyer's photo** (`/onboarding-lawyers/sofia-marchetti.jpg`) as its default, with `name` defaulting to `'You'`.
- **Neither new route can be cancelled**, and both leak raw upstream error text to the caller.
- **No test page exists** — `app/layout.tsx` was added for an `/api-test` route that was never written.

---

## 7. New since v1

Read against `notes/intake-audit.md` (737 lines), which is **not** modified by this pass. Of 21 items: **12 new, 7 sharpened, 2 contradicted.** v1 is a UX diagnosis with no import paths, no type bodies, no SDK facts, no endpoint contracts and no recommendations — so most of v2 is additive rather than corrective.

### Contradicts v1 — 2

| Topic | v1 | v2 |
|---|---|---|
| **`/api/intake` is not SSE** | Calls it "the SSE streaming route" and treats it as ready to wire (L159-160, L723-726) | The header says `text/event-stream`; `toReadableStream()` emits NDJSON. The obvious client gets **zero events**. Confirmed in the installed SDK. |
| **`StreamingText`'s 1400 ms is a floor, not a cap** | "at 34ms/word, **capped at 1400ms**" (L47-48); the latency budget totals "≈13 seconds" on that basis | `Math.max(34, floor(1400/totalWords))` makes 1400 ms a **floor on the total**. ≤41 words takes 1400 ms; ~300 words takes ≈10 s. The file's own comment says "floor," so v1's latency budget **understates** long replies. |

### Sharpened — 7

- **File bytes** — v1 named `toIntakeFiles` (`file-utils.ts:24-30`). v2 adds that lines 25-29 are decisive, that the parameter `f` is the last `File` reference in the flow, that the *type* `IntakeFile` is the structural cause, and that the helper has exactly one consumer module (so it is a clean single edit).
- **`/api/extract`** — v1: "an extraction endpoint that *does* accept PDF document blocks exists, and nothing calls it." v2: the full request/response contract, every status code, and a live defect v1 did not reach (`max_tokens`).
- **"Zero importers"** → there is no stream-reading machinery anywhere to import it *with*; one grep hit repo-wide.
- **`components/design/intake/` "was ignored as instructed"** → it is provably **unreachable**, via a single dead root, and it contains a second draft store and an orphaned resume banner.
- **Persistence** → the exact key (`playground:new-case-intake:v2`), the 300 ms debounce, the empty catch, the 60-message ceiling. v1 named only the created-titles key, so the store holding the client's actual case was never identified.
- **Drag-and-drop data loss** → confirmed repo-wide (only four non-test files contain `onDrop`/`dataTransfer`), **and the correct guard already exists** in `@repo/ui/chat-composer` with a comment naming the exact failure.
- **`script.ts:264` correction-corruption** → reframed as the absence of any provenance *model*: `Record<string, string>` with `''` overloaded makes provenance unrepresentable, which is why §5 replaces the type rather than patching the write.

### New — 12

1. **`StreamingText` cannot render incrementally arriving text** — `setCount(0)` + `[text]` dependency. v1 treats it only as latency theatre; `setCount` appears 0 times in v1.
2. **No multipart path exists**; the browser must base64-encode, and `lib/image-utils.ts:44` is a trap. v1 establishes the negative ("no FileReader, no base64, no FormData") but never states what the endpoint requires or how to satisfy it.
3. **`/api/extract` has a live defect** — `max_tokens: 1024` with no `stop_reason` guard. v1 contains zero hits for `max_tokens`, `stop_reason`, or `cache_control`.
4. **Anthropic SDK reality** — version **0.125.0**; the repo already uses the **current** `output_config.format` spelling; `Base64PDFSource`/`DocumentBlockParam` verified; **`tsc --noEmit` exits 0**. v1 contains zero hits for `@anthropic-ai`, `output_config`, `json_schema`, `media_type`, or any model ID.
5. **The date-suffixed model ID is required, not sloppy** — structured outputs supports `claude-haiku-4-5-20251001` and **not** `claude-haiku-4-5`. Tidying it breaks the endpoint. Nothing like this is in v1.
6. **Every `/api` route is gated by one shared password in `proxy.ts`** — and Next 16 renamed `middleware.ts` → `proxy.ts`. No per-user auth, no rate limit on the model routes. v1 has zero hits for `proxy`, `middleware`, `auth`, `cookie`, `401`.
7. **A component inventory with verified import paths** — structurally absent from v1, which contains zero `@repo/ui` or `@/components` references and exactly one repo-relative path (L6-7).
8. **Three parallel component trees, not interchangeable** — and one pair has diverged. `packages/ui` never appears in v1.
9. **No Progress or Stepper primitive exists** — nine hand-rolled bars; no `@radix-ui/react-progress` in any manifest.
10. **`Badge` is the only viable state primitive**; `Marker` and `Chip` cannot express confirmed/inferred/missing despite their names.
11. **A click-to-edit field with Save/Discard already exists** — `EditableValue`, live, plus `InlineField` as the minimal variant. v1 never surveys editing affordances.
12. **A proposed brief state shape** with per-field value/source/confidence and its reducer. v1 proposes nothing — it has no recommendations section of any kind.

### v1 findings this pass re-confirmed (not superseded)

Uploads are a total no-op, traced end to end · `/api/extract` and `/api/intake` have zero callers (re-verified three independent ways) · `/api/ai-intake` reports every failure as HTTP 200 `{ok:false}` · no submission backend — `onSubmitCase` is a bare 900 ms `setTimeout`, and `void description;` really does discard the AI-written brief · the submitted snapshot is deleted and only the title string survives · the brief panel renders labels, never values, and grants "complete" from mere presence · `useAiCaseIntake` defaults false and `useSimplifiedMatterIntake` defaults true · the mic pastes a hardcoded transcript (in **both** composer copies) · no file validation of any kind · silent transcript truncation at 60 messages · `aiRecap`'s `signal` is never passed, so `enrichRecap` is unbounded and survives "Start over" · the dead-code inventory holds.

v1's line-number discipline largely checked out: across ~60 citations re-opened during verification, the substantive ones landed on the quoted code, with drifts of one to two lines.

---

## The one thing still unproven

Everything above about `/api/extract` is **static**: it compiles (exit 0), and every parameter, type and block shape matches the installed SDK rather than my recollection. What has *not* happened is a single live request — the route has never been executed by anything.

To close that gap in about a minute, unlock the gate in the UI, then:

```bash
curl -s -b cookies.txt -X POST localhost:3080/api/extract \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"I need help with a supplier contract dispute."}]}' | jq
```

A well-formed `{matterType, fields:[…]}` closes it. I did not run this, because it spends money against the live API key — say the word and I will.
