import { nextJsConfig } from '@repo/eslint-config/next-js';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  /*
   * Accessibility, at lint time.
   *
   * The intake was audited by hand and by axe and came out with real findings
   * — a heading structure with no `h1`, a progress bar reading "75%" instead
   * of "6 of 8 confirmed", an error message not associated with the control
   * it was about. None of those are things a person should have to remember
   * on the next component, and about half the class of them is mechanically
   * checkable: a label on every input, alt text on every image, a role that
   * exists, a handler on something focusable.
   *
   * `recommended` rather than `strict`. Strict adds rules this codebase would
   * have to argue with rather than obey — it objects to `autoFocus` outright,
   * which the composer uses deliberately and correctly on a screen whose only
   * purpose is typing into it, and the argument for each exception is longer
   * than the rule is worth.
   *
   * On the app config rather than in `@repo/eslint-config`, deliberately. The
   * shared package is every future app's baseline and turning a11y on there
   * is a decision about all of them, taken while looking at one of them. The
   * right move is to prove it here, on the surface that was audited, and
   * promote it once the dashboard's own violations have been counted.
   *
   * `pnpm lint` runs `eslint --max-warnings 0`, so these are errors in
   * practice whatever severity they carry.
   */
  {
    ...pluginJsxA11y.flatConfigs.recommended,
    /*
     * An allow-list, not the whole app, and the difference is the point.
     *
     * Turned on everywhere this reports 40 warnings across the ported demos,
     * the onboarding flow, the rich-text editor and the foundations gallery —
     * none of which this audit looked at, none of which anybody is fixing
     * this week, and all of which would fail `--max-warnings 0` from the
     * first commit. A rule that fails the build for code nobody is fixing is
     * a rule that gets deleted within a fortnight, and then the surface that
     * *was* fixed loses its guard along with everything else.
     *
     * So it binds to the directories the intake renders from — the same four
     * the colour and type guards use — plus the route that mounts them. The
     * rest of the app stays a known, countable backlog rather than a silenced
     * one: widen this list a directory at a time as each is cleaned, and the
     * list itself is the record of how far that has got.
     */
    files: [
      'components/design/intake-v2/**/*.{ts,tsx}',
      'components/design/intake/chat/**/*.{ts,tsx}',
      'components/design/new-case/**/*.{ts,tsx}',
      'components/shared/**/*.{ts,tsx}',
      'app/[locale]/(dashboard)/client/**/*.{ts,tsx}',
    ],
  },
  {
    files: ['next.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Tabular Playbook is a verbatim port of the Designwise demo. Its loose cell
    // value types and hand-tuned effect dependencies are part of the ported
    // behaviour, so tightening them here would mean rewriting the demo.
    files: ['components/design/tabular-playbook/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
