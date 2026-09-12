# Assets audit — lawyer photos, logos, fonts, brand

Date: 2026-09-11  
Scope: read-only. No code was changed for this report.

---

## 1. Image files

Every image found under the app (excluding `node_modules` / `.next` / `.git`):

### People photographs (headshots)

| Path | Type | Dimensions | Notes |
| --- | --- | --- | --- |
| `apps/legal-intake-design/public/onboarding-lawyers/aaron.png` | PNG | 620×370 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/aelita-jacob.png` | PNG | 682×840 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/amara-okonkwo.jpg` | JPEG | 1536×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/catarina-milagre.png` | PNG | 581×700 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/daniel-dalla-vedova.png` | PNG | 682×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/daniel-foss.jpg` | JPEG | 1536×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/enes.png` | PNG | 620×370 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/eric.png` | PNG | 768×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/james-whitfield.jpg` | JPEG | 1536×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/kyle-westaway.png` | PNG | 800×800 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/maxim-van-eeckhout.png` | PNG | 800×800 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/mei-lin-chen.jpg` | JPEG | 1536×1024 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/mike.png` | PNG | 620×370 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/pamir.png` | PNG | 1024×972 | Person photo |
| `apps/legal-intake-design/public/onboarding-lawyers/sofia-marchetti.jpg` | JPEG | 1536×1024 | Person photo (also used as default client avatar) |

**Count: 15 real person photographs in the repo.**

### Logos / marks

| Path | Type | Dimensions | Kind |
| --- | --- | --- | --- |
| `apps/legal-intake-design/public/moritz-logo.png` | PNG | 300×89 | Logo (wordmark-style raster) |
| `apps/legal-intake-design/public/moritz-symbol.svg` | SVG | viewBox ~902×1058 | Logo mark (M in ring) |
| `apps/legal-intake-design/public/moritz-wordmark.svg` | SVG | viewBox ~1838×547 | Wordmark |
| `apps/legal-intake-design/app/icon.svg` | SVG | 900×1057 | App favicon / icon (Moritz mark) |

### Illustrations / UI icons (not people)

| Path | Type | Dimensions | Kind |
| --- | --- | --- | --- |
| `apps/legal-intake-design/public/new-case.svg` | SVG | 160×160 | Illustration |
| `apps/legal-intake-design/public/schedule-meeting.svg` | SVG | 160×160 | Illustration |
| `apps/legal-intake-design/public/tabular-playbook/docx.svg` | SVG | 17×16 | File-type icon |
| `apps/legal-intake-design/public/tabular-playbook/pdf.svg` | SVG | 17×16 | File-type icon |
| `apps/legal-intake-design/public/tabular-playbook/google-drive.svg` | SVG | 32×29 | Integration icon |
| `apps/legal-intake-design/public/tabular-playbook/imanage.svg` | SVG | 34×29 | Integration icon |
| `apps/legal-intake-design/public/tabular-playbook/netdocuments.svg` | SVG | 28×29 | Integration icon |
| `apps/legal-intake-design/public/tabular-playbook/sharepoint.svg` | SVG | 28×29 | Integration icon |

No other image files were found outside these paths (no PDFs with brand art).

---

## 2. Lawyer data

### `components/design/new-case/lawyers.ts`

This file does **not** define photos itself. It imports `ONBOARDING_LAWYERS` and picks who to show after intake submit:

- Standard accounts: `showcaseForMatter(matterId)` — rotates through the onboarding roster, optionally leading with a matter-matched person.
- Enterprise accounts: fixed pod `ENTERPRISE_POD` (intended as Daniel, Amara, Mei Lin).

**Important wiring note:** it looks up `onboarding-lawyer-amara` and `onboarding-lawyer-mei`, but those IDs are **not** in `ONBOARDING_LAWYERS` today. The lookup falls back to the first onboarding lawyer (Daniel Dalla Vedova). The Amara and Mei Lin **photo files still exist** on disk and are used elsewhere (mocks, foundations avatar page, share dialog).

### `components/design/onboarding/onboarding-lawyers.ts`

Curated personas with **local** `/onboarding-lawyers/...` paths (real files in `public/`).

**`ONBOARDING_LAWYERS` (5 people):**

| Name | Photo source |
| --- | --- |
| Daniel Dalla Vedova | Real file: `/onboarding-lawyers/daniel-dalla-vedova.png` |
| Kyle Westaway | Real file: `/onboarding-lawyers/kyle-westaway.png` |
| Max Van Eeckhout | Real file: `/onboarding-lawyers/maxim-van-eeckhout.png` |
| Aélita Jacob | Real file: `/onboarding-lawyers/aelita-jacob.png` |
| Catarina Milagre | Real file: `/onboarding-lawyers/catarina-milagre.png` |

Each also has initials (`DV`, `KW`, etc.) as an Avatar fallback if the image fails.

**`ADDITIONAL_TEAM_LAWYERS` (5 more, homepage + submit showcase):**

| Name | Photo source |
| --- | --- |
| Eric | Real file: `/onboarding-lawyers/eric.png` |
| Aaron | Real file: `/onboarding-lawyers/aaron.png` |
| Mike | Real file: `/onboarding-lawyers/mike.png` |
| Enes | Real file: `/onboarding-lawyers/enes.png` |
| Pamir | Real file: `/onboarding-lawyers/pamir.png` |

None of these use external URLs. None are initials-only by design — every entry has an `imageUrl` pointing at a repo file.

### `components/design/homepage-v2/legal-team.tsx`

Renders a rotating “Your legal team” grid using `ONBOARDING_LAWYERS` + `ADDITIONAL_TEAM_LAWYERS`. Each cell shows:

- `AvatarImage` with `lawyer.imageUrl` (local public path)
- `AvatarFallback` with `lawyer.initials` if the image does not load
- First name + tagline under the photo

Also exports `AVATAR_FRAMING` crop/zoom classes so headshots line up visually.

### Other photo files not in those three data files

Still in `public/onboarding-lawyers/` and used by mocks / foundations / client avatar defaults:

| File | Typical use |
| --- | --- |
| `amara-okonkwo.jpg` | Mock company lawyers, share dialog, foundations demo |
| `mei-lin-chen.jpg` | Same |
| `daniel-foss.jpg` | Foundations avatar demo / mocks |
| `james-whitfield.jpg` | Mock lawyer / notifications |
| `sofia-marchetti.jpg` | Default **client** chat/nav avatar (not a lawyer showcase lead) |

---

## 3. Avatar fallback on the case submitted card

On `CaseSubmittedCard`, each lawyer Avatar is:

1. **Preferred:** the headshot (`AvatarImage` with `lawyer.imageUrl`).
2. **If the photo is missing or fails to load:** `AvatarFallback` showing the lawyer’s **initials** (e.g. `DV`, `KW`).

What that looks like to a client today:

- A **circle** (or the avatar’s rounded shape) filled with a soft muted grey background (`bg-muted`).
- The initials centered in muted foreground text (`text-muted-foreground`), medium weight on the profile treatment.
- **Not** a coloured brand circle with random colour — it is the quiet grey foundation fallback.
- **Not** a blank empty disc — initials are always supplied in the lawyer data.

In the happy path (normal network, files present), clients **do see real photos** on the submitted card, not the fallback. The fallback is the safety net.

---

## 4. Moritz logo

There are several logo forms:

| Asset | Path | Form |
| --- | --- | --- |
| Raster logo | `apps/legal-intake-design/public/moritz-logo.png` | PNG file |
| Symbol SVG | `apps/legal-intake-design/public/moritz-symbol.svg` | SVG file |
| Wordmark SVG | `apps/legal-intake-design/public/moritz-wordmark.svg` | SVG file |
| Favicon | `apps/legal-intake-design/app/icon.svg` | SVG file |
| React icon component | `apps/legal-intake-design/components/icons/moritz-symbol.tsx` (+ `moritz-symbol.css` for shine animation) | Inline SVG component |

So: **SVG files + a React SVG component + a PNG**. Not CSS-drawn as the primary logo.

Intake chat uses the React `MoritzSymbol` component for the assistant avatar.

---

## 5. Fonts

### Actively loaded (as expected)

In `apps/legal-intake-design/app/[locale]/layout.tsx` via `next/font/google`:

| Font | Role | Status |
| --- | --- | --- |
| **Inter** | Sans / UI body | Present and loaded |
| **Cormorant Garamond** | Serif display headings | Present and loaded |
| **IBM Plex Mono** | Mono / code / tokens | Present and loaded |

CSS variables: `--font-inter`, `--font-cormorant-garamond`, `--font-ibm-plex-mono`. Also described in `app/globals.css` and the foundations typography page.

**None of those three are missing.**

### Extra font files on disk but not wired

Under `apps/legal-intake-design/app/fonts/`:

- `AeonikPro-Regular.otf`
- `GeistVF.woff`
- `GeistMonoVF.woff`

No `localFont` / `@font-face` / import references these files. They are **present but unused**.

---

## 6. Brand folder / guidelines

Searched for brand guidelines, style guides, design specs, brand sheets, and PDFs.

| Find | Result |
| --- | --- |
| Brand guidelines PDF or MD | **Does not exist** |
| Style guide document | **Does not exist** |
| Design spec PDF | **Does not exist** (no PDFs in the repo at all) |
| Folder named brand / guidelines | **Does not exist** |
| Closest UI file | `components/design/onboarding/onboarding-brand-panel.tsx` — onboarding marketing panel, not a guidelines doc |
| Colour “brand sheet” | Referenced only in **comments** in `foundations/tokens/colors.ts` and `app/globals.css`; the actual sheet is not in the repo |
| Prior audit note | `notes/repo-audit.md` already recorded that brand guidelines do not exist |

Brand colour tokens **do** live in code (`globals.css`, `packages/ui` theme, `tokens/colors.ts`).

---

## Bottom line

**Do real lawyer photographs exist in this repo?**

# Yes.

There are **15** headshot files under `apps/legal-intake-design/public/onboarding-lawyers/`. The intake / onboarding / homepage lawyer UIs point at those local files (not external URLs). Initials-only circles are only the Avatar fallback if a photo fails to load.
