import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { WAITING_SYSTEM_PROMPT } from './waiting-prompt';

/**
 * One turnaround figure, everywhere, and it is 24 hours.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS ONE APP-WIDE GUARD RATHER THAN A CHECK PER SURFACE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The flow promised a quote in four hours. Moritz's own published figure is
 * 24, so every one of those was a commitment the firm had not made, shown to
 * a client deciding whether to trust it with a dispute.
 *
 * What makes it worth a guard is not the number, it is how far it had spread
 * from any one component: eight copy strings, the **waiting system prompt**
 * (so the live model said it too, in its own words, where no copy review
 * would ever have found it), a hardcoded fallback in `handoff-card.tsx` that
 * only appears when no labels are passed, and two tests that asserted the
 * wrong figure and therefore defended it.
 *
 * A per-component test cannot see that shape. The failure is a *figure
 * leaking*, so the check has to be over the whole app at once.
 *
 * Two files are exempt and both are genuinely about something else:
 * `first-drafts-data.ts` is contract body text where "four hours" is an SLA
 * restore window, and `person-messages.ts` is a fixture quoting what the old
 * card used to say. Neither is a promise this product is making.
 */

const ROOT = process.cwd();

/** The superseded figure, assembled so this file is not its own violation. */
const SUPERSEDED = ['four', 'hours'].join(' ');

/**
 * Contract prose and a fixture, not promises. See the note above.
 *
 * `turnaround.test.ts` exempts itself for the obvious reason: a test that
 * forbids a string cannot avoid containing it.
 */
const EXEMPT = [
  'components/design/first-drafts-admin/first-drafts-data.ts',
  'lib/mocks/person-messages.ts',
  'lib/intake/turnaround.test.ts',
];

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(tsx?|json)$/.test(name)) out.push(path);
    }
  };
  for (const dir of ['components', 'lib', 'app', 'messages']) {
    try {
      walk(join(ROOT, dir));
    } catch {
      // A directory that does not exist is not a violation.
    }
  }
  return out;
}

describe('the quote turnaround', () => {
  it('has files to check', () => {
    expect(sourceFiles().length).toBeGreaterThan(100);
  });

  it('is never given as the superseded figure', () => {
    const offences: string[] = [];
    for (const path of sourceFiles()) {
      const rel = relative(ROOT, path);
      if (EXEMPT.some((one) => rel.endsWith(one))) continue;
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (line.includes(SUPERSEDED)) offences.push(`${rel}:${index + 1}`);
        });
    }
    expect(
      offences,
      `the superseded turnaround survives at: ${offences.join(', ')}`,
    ).toEqual([]);
  });

  /*
   * The half a copy review cannot reach. The model is told the turnaround in
   * prose and repeats it in its own words, so a stale prompt produces a stale
   * promise in a sentence that exists nowhere in the repo.
   */
  it('is 24 hours in the waiting system prompt', () => {
    expect(WAITING_SYSTEM_PROMPT).toContain('within 24 hours');
    expect(WAITING_SYSTEM_PROMPT).not.toContain(SUPERSEDED);
  });

  it('is 24 hours everywhere the client is told it', () => {
    const intake = messages.intake;
    expect(intake.quote.explanation).toContain('24 hours');
    expect(intake.sent.quoteHere).toContain('24 hours');
    expect(intake.journey.note.quote).toContain('24 hours');
    expect(intake.howItWorks.when.quote).toContain('24 hours');
  });
});

/**
 * The sending screen speaks in the present tense.
 *
 * Carried over from Step C. `quote.explanation` opens "**When you send
 * this**, one of our lawyers reads it…", which is right on every screen
 * before the click and wrong on the one after it — a client watching the send
 * animation was being told in the future tense about something they had just
 * done, in the seconds where they are least sure it worked.
 */
describe('the sending footer', () => {
  it('has its own line, in the present', () => {
    const sending = messages.intake.quote.explanationSending;
    expect(sending).toBeTruthy();
    expect(sending).toContain('is reading');
    expect(sending).not.toContain('When you send');
  });

  it('keeps the two facts that matter either way', () => {
    const sending = messages.intake.quote.explanationSending;
    expect(sending).toContain('24 hours');
    expect(sending.toLowerCase()).toContain('nothing is charged');
  });

  it('is what the sending phase actually renders', () => {
    const source = readFileSync(
      join(ROOT, 'components/design/intake-v2/intake-v2.tsx'),
      'utf8',
    );
    const map = /const FOOTER_SENTENCE[\s\S]*?\n\};/.exec(source)?.[0] ?? '';
    expect(map).toContain("sending: 'quote.explanationSending'");
  });
});
