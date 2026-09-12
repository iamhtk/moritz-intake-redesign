# Design Playground

A Next.js design playground for a legal-services web app, built on a small
pnpm/turborepo monorepo. Every screen runs against typed in-memory mock data:
there is no database, no auth provider, no payments and no background jobs. You
can switch between the app's four user roles and toggle in-progress design
proposals from inside the UI.

This repository contains:

| Path                         | What it is                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/legal-intake-design`   | The playground itself: a Next.js 16 App Router app (React 19, Tailwind CSS v4, next-intl).      |
| `packages/ui`                | `@repo/ui`, the shared component library (shadcn/Radix-based components, hooks, icons, styles). |
| `packages/config`            | `@repo/config`, shared Vitest and Playwright base configuration.                                |
| `packages/eslint-config`     | `@repo/eslint-config`, shared ESLint flat configs.                                              |
| `packages/typescript-config` | `@repo/typescript-config`, shared `tsconfig` bases.                                             |

## Prerequisites

You need three tools installed. Everything else is pulled in by `pnpm install`.

### 1. Node.js 24

The repo declares `node >= 24` in `package.json` and pins the major version in
`.nvmrc`. Any Node version manager works. With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install    # reads .nvmrc
nvm use
node --version # v24.x
```

With [fnm](https://github.com/Schniz/fnm): `fnm install && fnm use`. With
[Volta](https://volta.sh): `volta install node@24`.

The app also starts on Node 22, but you will see an "Unsupported engine" warning
on every command. Use 24 to match the declared toolchain.

### 2. pnpm 11

The repo pins `pnpm@11.25.0` through the `packageManager` field. The simplest
way to get exactly that version is Corepack, which ships with Node:

```bash
corepack enable
pnpm --version # 11.25.0, downloaded on first use
```

If you prefer a global install, `npm install -g pnpm@11` works too. Do not use
npm or yarn to install dependencies: the workspace relies on pnpm features
(workspace protocol, catalogs, `publicHoistPattern`).

### 3. Git

Any recent version.

You do **not** need Docker, a database, or any cloud credentials.

## Getting started

1. Copy `.env.example` to `.env.local` and add an Anthropic API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `ANTHROPIC_API_KEY` to your key. Then copy it into the Next.js app folder (Next loads env from there):

```bash
cp .env.local apps/legal-intake-design/.env.local
```

2. Install dependencies with pnpm:

```bash
pnpm install
```

3. Run the dev server:

```bash
pnpm dev
```

## Install

From the repository root:

```bash
pnpm install
```

This installs all workspace packages and links `@repo/*` packages into the app.
A handful of dependencies compile native or download platform binaries during
install (`@swc/core`, `esbuild`, `@parcel/watcher`, `unrs-resolver`); they are
pre-approved in `pnpm-workspace.yaml` under `allowBuilds`, so no prompt appears.

## Run the app in development mode

```bash
pnpm dev
```

This runs `turbo run dev --filter=legal-intake-design`, which starts the Next.js
dev server with Turbopack on **http://localhost:3080**. The first page compile
takes a few seconds; subsequent edits hot-reload.

You can also start the app directly from its own folder, which is handy if you
want to pass extra flags to Next:

```bash
pnpm --filter legal-intake-design dev
```

### The password gate

The playground is protected by a simple password screen. In development the
password is **`123`**. It comes from `PLAYGROUND_PASSWORD` in
`apps/legal-intake-design/.env.development`. Entering it sets a signed cookie
that unlocks the app for 30 days in that browser.

### Environment variables

The `dev` script wraps Next in [dotenvx](https://dotenvx.com), which loads
`apps/legal-intake-design/.env.development`. That file is committed and contains
everything the UI needs:

| Variable                 | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `PLAYGROUND_PASSWORD`    | Password for the gate screen (`123`).       |
| `PLAYGROUND_GATE_SECRET` | HMAC secret used to sign the unlock cookie. |

AI intake and extraction routes also need `ANTHROPIC_API_KEY` in
`apps/legal-intake-design/.env.local` (see Getting started). Optional overrides:
`ANTHROPIC_TURN_MODEL`, `ANTHROPIC_RECAP_MODEL`.

The dev script also references a `.env.keys` file at the repo root. It is
optional and gitignored; the `--ignore=MISSING_ENV_FILE` flag lets the server
start without it.

## Using the playground

1. Open http://localhost:3080. You are redirected to `/en` and shown the
   password screen. Enter `123`.
2. You land on the home page of the current role. The default role is the
   client. Role home pages are `/en/client`, `/en/legal`, `/en/admin` and
   `/en/user`.
3. Open **Settings** (the `/en/user` page, "Design playground" section) to:
   - **Switch role** between `NON_LEGAL` (client), `LEGAL` (lawyer),
     `INTERNAL_ADMIN` and `INTERNAL_ASSISTANT`. The choice is stored in
     `localStorage` and in a `playground_role` cookie so server components see
     it on the next render. Switching redirects you to that role's home page.
   - **Toggle design flags** for in-progress proposals (new sidebar, top
     navigation, settings v2 modal, simplified intake, playbooks, Slack
     integration, and so on). Flag state lives in `localStorage` under
     `playground:design-flags`. Flags are declared in
     `apps/legal-intake-design/components/design/feature-flags/design-flags-registry.ts`
     and read through the `useDesignFlags()` hook.
4. Visit `/en/foundations` for a component gallery that exercises the shared
   `@repo/ui` primitives (buttons, inputs, dialogs, tables, typography, colors,
   and more).

The playground is light-mode only. `next-themes` is configured with
`forcedTheme="light"`.

## Project layout

```
.
├── apps/legal-intake-design/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          html/body, fonts, providers, password gate
│   │   │   ├── page.tsx            redirects to the current role's home
│   │   │   ├── (auth)/             sign-in screens (mocked)
│   │   │   ├── (dashboard)/        admin/, client/, legal/, user/, notifications
│   │   │   ├── foundations/        component gallery
│   │   │   └── onboarding/         client signup flow
│   │   └── api/
│   │       ├── gate/               issues the unlock cookie
│   │       └── ai-intake/          server-side proxy for the optional AI intake
│   ├── components/
│   │   ├── design/                 net-new design proposals, grouped by feature
│   │   ├── playground/             role context, auth stubs, password gate
│   │   ├── navigation/             sidebar, header, footer
│   │   └── ...                     screen components (cases, quotes, admin, ...)
│   ├── lib/
│   │   ├── mocks/                  typed fixtures (cases, users, quotes, ...)
│   │   ├── playground/             gate token helpers
│   │   └── types.ts                shapes the UI consumes
│   ├── i18n/                       next-intl routing and request config
│   ├── messages/en.json            UI strings
│   ├── proxy.ts                    Next middleware: locale routing + API gate
│   └── .env.development            dev environment variables (committed)
├── packages/
│   ├── ui/                         @repo/ui component library
│   ├── config/                     @repo/config (vitest, playwright bases)
│   ├── eslint-config/              @repo/eslint-config
│   └── typescript-config/          @repo/typescript-config
├── package.json                    root scripts, Prettier config
├── pnpm-workspace.yaml             workspace globs, dependency catalog
└── turbo.json                      task pipeline
```

### How the app is wired

- **Routing and i18n**: `next-intl` handles the `[locale]` segment. Only `en`
  is enabled (see `lib/locales.ts`). UI strings live in `messages/en.json` and
  are read with `useTranslations` / `getTranslations`.
- **Roles**: `components/playground/auth-stubs.ts` reads the `playground_role`
  cookie and returns a deterministic mock user from `lib/mocks/users.ts`. The
  dashboard layout and navigation render against that user.
- **Data**: every list and detail screen imports fixtures from `lib/mocks/`.
  Mutations are stubbed with a short `setTimeout` and a toast; nothing is
  persisted.
- **Shared UI**: `@repo/ui` exports components under `@repo/ui/components/*`,
  hooks under `@repo/ui/hooks/*`, `cn` under `@repo/ui/lib/utils`, icons under
  `@repo/ui/icons`, and the global Tailwind stylesheet as
  `@repo/ui/globals.css`. The app's `tsconfig.json` maps `@repo/ui/*` straight
  to the package's `src/`, and `next.config.js` lists it in
  `transpilePackages`, so edits to the library hot-reload in the app.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. The app reuses the
  library's PostCSS config (`postcss.config.mjs` re-exports
  `@repo/ui/postcss.config`).

## Other commands

All commands run from the repository root.

| Command                                   | What it does                                                     |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                | Start the playground dev server on port 3080.                    |
| `pnpm typecheck`                          | `tsc --noEmit` in every workspace package.                       |
| `pnpm test`                               | Vitest unit tests (currently in `packages/ui`).                  |
| `pnpm lint`                               | Prettier check across the repo.                                  |
| `pnpm lint-fix`                           | Prettier write across the repo.                                  |
| `pnpm turbo run lint`                     | ESLint in every workspace package.                               |
| `pnpm verify`                             | Prettier check, then ESLint, typecheck and unit tests via turbo. |
| `pnpm --filter legal-intake-design build` | Production build of the app (not required for development).      |
| `pnpm --filter @repo/ui test:watch`       | Vitest in watch mode for the component library.                  |

Turbo caches task outputs under `.turbo/`. Add `--force` to any `turbo run`
command to bypass the cache.

## Conventions

- **TypeScript strict mode** everywhere. Type imports use inline
  `import { type Foo }` form (enforced by ESLint).
- **Server Components by default.** Add `"use client"` only when a component
  needs state, effects, or browser APIs.
- **Reuse `@repo/ui`** before writing a new primitive. New design proposals go
  under `apps/legal-intake-design/components/design/<feature>/`.
- **Icons** come from `@repo/ui/icons`; importing `lucide-react` directly is
  blocked by an ESLint rule.
- **UI strings** go through `next-intl`, not hard-coded JSX text.
- **Formatting** is Prettier with single quotes and the Tailwind class-sorting
  plugin. Run `pnpm lint-fix` before committing.

## Troubleshooting

- **`Unsupported engine` warning**: you are on Node < 24. Run `nvm use` (or the
  equivalent for your version manager) and re-run the command.
- **Port 3080 already in use**: stop the other process, or run
  `pnpm --filter legal-intake-design exec next dev --turbopack --port 3081`.
  Note that this bypasses dotenvx, so also export `PLAYGROUND_PASSWORD` and
  `PLAYGROUND_GATE_SECRET` in your shell first.
- **Password screen keeps coming back**: the unlock cookie is scoped to the
  host and port you opened. Use the same URL each time, or clear the
  `pg_unlocked` cookie and log in again.
- **Stale build output after switching branches**: delete
  `apps/legal-intake-design/.next` and restart `pnpm dev`.
- **`next dev` created `AGENTS.md` / `CLAUDE.md` in the app folder**: Next.js
  16 regenerates these on every start. They are gitignored; ignore them.
