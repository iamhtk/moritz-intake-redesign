# Foundations

Design-iteration foundation components and the showcase that documents them. The
folder is split by role so engineers can tell at a glance which files are
production-liftable components and which only support the `/foundations` docs
site.

| Folder        | Role                                                                                                                                                     | Lift into production?                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `components/` | Core, reusable foundation components (`button`, `input`, `select`, `switch`, `dropdown-menu`, etc.).                                                     | Yes — these are the pieces to productionise. |
| `tokens/`     | Design-token data (`colors.ts`).                                                                                                                         | Yes — token values feed the components.      |
| `examples/`   | Stateful demos rendered only by the showcase pages (`*-examples.tsx`).                                                                                   | No — showcase-only.                          |
| `showcase/`   | Docs-site machinery: `library-sidebar`, `section`, `foundations-nav` (sidebar/index nav), plus the docs display helpers `code-block` and `color-swatch`. | No — only powers the `/foundations` pages.   |

## Adding a new foundation component

1. Add the component to `components/`.
2. If it needs demo state, add a `<name>-examples.tsx` to `examples/`.
3. Add a `/foundations/<name>` page under `app/[locale]/foundations/` that
   composes the component with `Section` from `showcase/`.
4. Register it in `showcase/foundations-nav.ts` (single source of truth for the
   sidebar and the index page).

See `apps/legal-intake-design/AGENTS.md` for the component-reuse policy
(`@repo/ui` first, new design components here, no edits to shared packages).
