# Repository audit — design-engineer-case

Date: 2026-09-11  
Scope: read-only audit. No application code was changed for this report.

---

## 1. Framework and versions

**Root `package.json`** is a pnpm/turbo monorepo orchestrator (scripts: `dev`, `lint`, `test`, `typecheck`, `verify`). It does not declare Next/React/Tailwind as direct dependencies. The runnable app is `apps/legal-intake-design`.

| Package | Declared (pnpm catalog / package.json) | Installed (resolved) |
| --- | --- | --- |
| Next.js | `16.3.3` | `16.3.3` |
| React | `19.2.4` | `19.2.4` |
| React DOM | `19.2.4` | `19.2.4` |
| Tailwind CSS | `^4.1.11` (catalog) | `4.1.17` (in `@repo/ui`) |
| TypeScript | `^5.9.3` | `5.9.3` |

**Package manager:** `pnpm` — evidenced by `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `"packageManager": "pnpm@11.25.0"`.

**TypeScript strict mode:** **Yes.** `packages/typescript-config/base.json` sets `"strict": true`. The app extends `@repo/typescript-config/nextjs.json`, which extends that base.

---

## 2. Can it run

1. `pnpm install` — succeeded: “Already up to date” (pnpm v11.25.0).
2. Dev server — already running via `pnpm dev` (turbo → `legal-intake-design` on port **3080**).
3. `GET http://localhost:3080/en` returned **200**.

**Starts cleanly?** Yes for Next.js / Turbopack. Recent logs show successful page loads (`/en/client/new`, `/en/foundations/*`, etc.).

**Non-fatal warnings observed (not startup failures):**
- Browser: `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}.` (repeated on some client pages)

No install or compile crash was observed during this check.

---

## 3. What kind of project this is

**A running application that doubles as a design playground** — not static exported screens and not only a Storybook-style component playground.

Evidence from folder structure (not README):

- Next.js App Router under `apps/legal-intake-design/app/` with live route groups: `(auth)`, `(dashboard)/admin|client|legal|user`, `foundations`, `onboarding`.
- Shared UI package `packages/ui` plus a large `components/` tree used by those routes.
- `app/api/` route handlers (`ai-intake`, `gate`).
- Password gate / playground stubs (`components/playground/`), mock data under `lib/mocks/`.
- Foundations showcase pages under `app/[locale]/foundations/` (component demos inside the same runnable app).

Verdict: interactive Next.js app with role-based dashboard screens, intake flows, and an in-app foundations gallery.

---

## 4. Design system

| Item | Exists? | Where |
| --- | --- | --- |
| Design token file | **Yes** | `apps/legal-intake-design/components/design/foundations/tokens/colors.ts`; brand CSS variables also in `apps/legal-intake-design/app/globals.css` and `packages/ui/src/styles/globals.css` |
| Tailwind theme config | **Yes (CSS-first, Tailwind v4)** | No classic `tailwind.config.js`. Theme via `@theme inline` in `packages/ui/src/styles/globals.css` (and mirrored tokens in app `globals.css`). PostCSS: `apps/legal-intake-design/postcss.config.mjs` → `@repo/ui/postcss.config` |
| Custom fonts loaded | **Yes** | Google fonts via `next/font/google` in `app/[locale]/layout.tsx`: Inter, Cormorant Garamond, IBM Plex Mono |
| Local font files present but **not loaded in code** | Files exist | `app/fonts/GeistVF.woff`, `GeistMonoVF.woff`, `AeonikPro-Regular.otf` — no `@font-face` / `localFont` references found |
| Components directories | **Yes** | `apps/legal-intake-design/components/` (439 `.ts`/`.tsx` files) and `packages/ui/src/components/` |

### `packages/ui/src/components/` — 50 component files

accordion, alert, attachment, avatar, badge, banner, breadcrumb, bubble, button, card, chat-composer, checkbox, chip, collapsible, combobox, composer-actions, description-list, dialog, drawer, dropdown-menu, email-layout, empty, field, heading, input-group, input-otp, input, item, label, markdown-content, marker, message-scroller, popover, radio-group, scroll-area, segmented-control, select, separator, sheet, skeleton, sonner, spinner, switch, table, tabs, text, textarea, toggle-group, toggle, tooltip

### Foundations mirror — 37 files under `components/design/foundations/components/`

alert, attachment, avatar, badge, banner, breadcrumb, bubble, button, card, checkbox, chip, collapsible, combobox, description-list, dialog, drawer, dropdown-menu, empty, heading, hover-card, input-group, input-otp, input, marker, message-scroller, popover, radio-group, select, slider, spinner, switch, table, tabs, text, textarea, toggle-group, toggle

**shadcn / Radix:**

- **shadcn:** yes — `components.json` (shadcn schema, “new-york”), dependency `@shadcn/react` in catalog/app/`@repo/ui`.
- **Radix:** yes — many `@radix-ui/react-*` packages plus `radix-ui` / `@radix-ui/react-slot` in app and UI package dependencies.

---

## 5. The intake flow

There are **two related intake implementations**:

1. **Current conversational entry** (wired from intake entry): `components/design/new-case/`
2. **Older / alternate matter wizard** under `components/design/intake/`

### File paths (requested surfaces)

| Surface | Path(s) |
| --- | --- |
| Chat interface | `apps/legal-intake-design/components/design/new-case/conversational-intake-flow.tsx` (primary entry via `components/design/intake/intake-entry.tsx`); also `components/design/intake/intake-flow.tsx`, `unified-intake-flow.tsx`, `components/intake-chat-shell.tsx`, `chat/chat-message.tsx` |
| Message input | `apps/legal-intake-design/components/design/intake/chat/chat-composer.tsx` (also mirrored in `packages/ui/src/components/chat-composer.tsx`) |
| File upload handling | `apps/legal-intake-design/components/design/intake/components/document-upload-zone.tsx`; attach card path in new-case messaging / `file-utils.ts`; mock extraction: `mock-document-extraction.ts`, `extraction-shimmer.tsx` |
| Case submitted confirmation | `apps/legal-intake-design/components/design/new-case/case-submitted-card.tsx`; older flow: `components/design/intake/components/intake-success.tsx` |
| Loading / waiting screens | `components/design/intake/components/generating-screen.tsx` + stages in `mock-draft-generation.ts`; typing wait: `chat/typing-indicator.tsx` (“Thinking…”); document wait: `extraction-shimmer.tsx` (“Reading your document…”) |

### String search: `"Closing a goal"`

**It does not exist** anywhere in the repository (exact string search returned no matches).

**Similar internal status wording that does exist:**

| Wording | Location |
| --- | --- |
| `Thinking…` | `components/design/intake/chat/typing-indicator.tsx` |
| `Thinking...` (examples) | `components/design/foundations/examples/marker-examples.tsx` |
| `Reading your document…` | `components/design/intake/components/extraction-shimmer.tsx` |
| `Reviewing your details…` / `Checking your documents…` / `Preparing your quote…` / `Wrapping up your quote…` | `components/design/intake/mock-draft-generation.ts` |
| Employment field key `goal` (question, not status chrome) | `components/design/new-case/matters/employment.ts` |

---

## 6. The checklist (matter types + required fields) — most important

**A dedicated Zod schema / JSON checklist / prompt-only checklist file for “fields required per matter type” does not exist as a single schema document.**

What **does** exist: TypeScript matter-flow definitions that enumerate matter types and per-matter questions.

### Primary (used by Anthropic + conversational intake)

- Registry: `apps/legal-intake-design/components/design/new-case/matters/index.ts`
- Shared tail questions: `.../matters/shared.ts`
- Per-matter flows:
  - `.../matters/contract.ts`
  - `.../matters/employment.ts`
  - `.../matters/procurement.ts`
  - `.../matters/corporate.ts`
  - `.../matters/ma.ts`
  - `.../matters/other.ts`
- Types: `apps/legal-intake-design/components/design/new-case/intake-types.ts` (`MatterId`, `IntakeQuestion`, `MatterFlow`)
- Engine: `apps/legal-intake-design/components/design/new-case/script.ts`

Matter IDs in this system: `contract`, `employment`, `procurement`, `corporate`, `ma`, `other`.

### Secondary (older intake registry)

- `apps/legal-intake-design/components/design/intake/matter-registry.ts`
- `apps/legal-intake-design/components/design/intake/matters/*.ts`
- Types: `apps/legal-intake-design/components/design/intake/intake-types.ts`

**Zod:** present as a dependency and used elsewhere in the app, but **not** as the matter-type field checklist source of truth for intake.

**Plain statement:** There is no standalone checklist JSON/Zod file. The checklist lives as TypeScript `MatterFlow.questions` arrays in the files above.

---

## 7. Agent code (LLM API calls)

### A. Anthropic (server-side — preferred for this project)

- Proxy route: `apps/legal-intake-design/app/api/ai-intake/route.ts`
- Implementation: `apps/legal-intake-design/components/design/new-case/ai/anthropic-intake.ts`
- Client: `apps/legal-intake-design/components/design/new-case/ai/ai-intake-client.ts`

Uses raw `fetch` to `https://api.anthropic.com/v1/messages` with `ANTHROPIC_API_KEY`. Defaults: turn model `claude-haiku-4-5`, recap model `claude-sonnet-5` (overridable via env).

**Turn system prompt (instructed to):**

- Assist a legal-intake chat for a non-lawyer opening a case; augment a deterministic script; stay minimal/precise.
- Return **only** minified JSON (`matterId`, `extracted`, `acknowledgement`, `offScript`).
- On matter-type step: classify into known matter ids (or `none`).
- Pre-fill later fields into `extracted` when confident.
- Answer off-script questions in `offScript.answer`.
- Otherwise emit a short warm `acknowledgement` (no follow-up question).

**Recap system prompt (instructed to):**

- Write a short case record.
- Return JSON with `title`, `description`, and `summaries` (paraphrased free-text fields).

### B. OpenAI (optional, client-side playground)

- `apps/legal-intake-design/components/design/intake/openai-intake-helpers.ts`
- Key from `localStorage` (`playground:openai-api-key`); calls `https://api.openai.com/v1/chat/completions` with `gpt-4o-mini`.

**Instructed to:** route matter type; extract structured fields from free text; compose deal summaries / lawyer briefs. Falls back to deterministic helpers when no key.

---

## 8. Data layer

| Layer | Status |
| --- | --- |
| Database (Prisma/Drizzle/SQL/etc.) | **Does not exist** in this repo |
| Mock data | **Yes** — `apps/legal-intake-design/lib/mocks/` (cases, users, companies, documents, quotes, waitlist, audit-log, etc.) |
| API routes | **Yes, minimal** — `app/api/ai-intake/route.ts` (Anthropic proxy), `app/api/gate/route.ts` (playground password gate) |
| Persistence for intake | Stubbed / local draft storage patterns; submitted cases are playground stand-ins (`case-submitted-card.tsx` comments note no backend) |

---

## 9. Human figures (images / avatars in the flow)

| Asset / component | Where it appears |
| --- | --- |
| `/public/onboarding-lawyers/*` (many headshots: png/jpg) | Onboarding showcase, homepage legal team, lawyer cards, case-submitted team showcase, top-nav default user |
| Default chat user portrait `sofia-marchetti.jpg` | `intake/chat/user-avatar.tsx`; also top-nav fallback |
| `MoritzAvatar` (logo mark, not a photo) | Assistant bubbles / typing indicator |
| Lawyer cards with `AvatarImage` | `intake/components/lawyer-card.tsx`, `case-submitted-card.tsx`, onboarding / homepage team UIs |

Illustrative SVGs (`new-case.svg`, `schedule-meeting.svg`) also exist under `public/` but are not photographic human figures.

---

## 10. Brand assets

| Asset type | Exists? | Location |
| --- | --- | --- |
| Brand guidelines document (PDF/MD named guidelines) | **Does not exist** | — |
| Logo / wordmark / symbol | **Yes** | `public/moritz-logo.png`, `public/moritz-wordmark.svg`, `public/moritz-symbol.svg`, `app/icon.svg`, `components/icons/moritz-symbol*` |
| Colour definitions | **Yes** | CSS variables in `app/globals.css` / `packages/ui/src/styles/globals.css`; token file `foundations/tokens/colors.ts` (comments reference a brand sheet) |
| Font files in repo | **Yes (files)** | `app/fonts/*.woff` / `.otf` (present; **not wired** into layout). Active fonts are Google fonts (Inter, Cormorant Garamond, IBM Plex Mono) |

---

## Quick map of monorepo

```
design-engineer-case/
  apps/legal-intake-design/   # Next.js 16 design playground app
  packages/ui/                # shared shadcn/Radix component library
  packages/config/
  packages/eslint-config/
  packages/typescript-config/
  pnpm-workspace.yaml
  pnpm-lock.yaml
  turbo.json
```
