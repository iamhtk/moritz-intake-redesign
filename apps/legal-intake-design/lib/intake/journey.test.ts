import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTAKE_PHASES, type IntakePhase } from './phase';
import { CASE_STAGES } from './case-stages';
import {
  JOURNEY_STAGES,
  JOURNEY_STEPS,
  journeyLineKey,
  journeyStepDone,
  journeyStepFor,
} from './journey';

/**
 * The stepper's position, which is the whole of what it claims.
 *
 * A stepper is a promise about where you are, so the failure mode worth testing
 * is not that it renders — it is that it points at the wrong step. Two of the
 * four pieces of feedback in the brief are orientation complaints, and a
 * stepper that says "Step 2 of 4" while the client is still typing would make
 * both of them worse rather than better.
 */

describe('the four steps', () => {
  it('are the four things the client actually experiences', () => {
    expect(JOURNEY_STEPS).toEqual(['brief', 'quote', 'lawyer', 'document']);
  });

  /*
   * Four, not the pipeline's seven. Drafting and both QA passes are "not shown
   * on the platform", so steps for them would sit still for hours and read as
   * stalled. See `journey.ts`.
   */
  it('is a short list, so a step moving means something', () => {
    expect(JOURNEY_STEPS.length).toBeLessThanOrEqual(4);
  });
});

describe('which step the client is on', () => {
  /*
   * Everything before the button is step one: they are still writing it. And
   * `sending` is one of them — see below.
   */
  it.each(['start', 'building', 'review', 'sending'] as const)(
    '%s is still the brief',
    (phase) => {
      expect(journeyStepFor(phase)).toBe(0);
    },
  );

  /*
   * ⭐ The submit boundary, and it used to be in the wrong place.
   *
   * "People do not understand when a case has actually been submitted" is the
   * first complaint in the brief. `sending` returned 1, so the rail ticked
   * Brief and moved to Quote on the click rather than on the answer — while
   * the request was still open and the case had reached nobody. A stepper that
   * advances on the click is that complaint rebuilt inside the component meant
   * to fix it. The step moves when the case has gone.
   */
  it('does not move while the request is still open', () => {
    expect(journeyStepFor('sending')).toBe(0);
    expect(journeyStepDone('sending', 0)).toBe(false);
  });

  /*
   * ⭐ The other half of the same bug, one line lower.
   *
   * Freezing the marker on `brief` through the wait is only half an answer:
   * the sentence under it still read "You are telling us about the matter"
   * while the request was in flight, which is the stepper misreporting the
   * wait in the one phase Garzai singled out — "assume your design has to
   * survive some gap between the click and the case actually being
   * submitted". They have finished telling us. The step does not move; the
   * sentence does.
   */
  it('stops claiming the client is still typing once they have sent', () => {
    expect(journeyLineKey('brief', 'building')).toBe('line.brief');
    expect(journeyLineKey('brief', 'review')).toBe('line.brief');
    expect(journeyLineKey('brief', 'sending')).toBe('line.sending');
  });

  /* One rule for both surfaces, and only the wait bends it. */
  it('overrides nothing else, on any step or any phase', () => {
    for (const phase of INTAKE_PHASES) {
      for (const step of JOURNEY_STEPS) {
        const key = journeyLineKey(step, phase as IntakePhase);
        if (step === 'brief' && phase === 'sending') continue;
        expect(key).toBe(`line.${step}`);
      }
    }
  });

  it.each(['sent', 'quoted'] as const)('%s has moved on', (phase) => {
    expect(journeyStepFor(phase)).toBe(1);
    expect(journeyStepDone(phase, 0)).toBe(true);
  });

  /* No phase can claim a step this flow does not deliver. */
  it('never points past the quote', () => {
    for (const phase of INTAKE_PHASES) {
      expect(journeyStepFor(phase as IntakePhase)).toBeLessThanOrEqual(1);
    }
  });

  /* Total, so a new phase cannot fall through to a default. */
  it('has an answer for every phase', () => {
    for (const phase of INTAKE_PHASES) {
      const index = journeyStepFor(phase as IntakePhase);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(JOURNEY_STEPS.length);
    }
  });
});

describe('which steps are ticked', () => {
  /*
   * A tick on the step you are working on is the "did it submit?" confusion in
   * a new place, so current is never done.
   */
  it('never ticks the current step', () => {
    for (const phase of INTAKE_PHASES) {
      const current = journeyStepFor(phase as IntakePhase);
      expect(journeyStepDone(phase as IntakePhase, current)).toBe(false);
    }
  });

  it('ticks nothing at all while the brief is being written', () => {
    for (const index of JOURNEY_STEPS.keys()) {
      expect(journeyStepDone('building', index)).toBe(false);
    }
  });

  it('leaves the lawyer and the document as what comes next', () => {
    for (const phase of INTAKE_PHASES) {
      expect(journeyStepDone(phase as IntakePhase, 2)).toBe(false);
      expect(journeyStepDone(phase as IntakePhase, 3)).toBe(false);
    }
  });
});

describe('the seven rows, nested inside the four steps', () => {
  /*
   * The map is the reason there is one stepper rather than two. The flow used
   * to draw four steps in the panel footer and seven rows under the
   * confirmation, as if they were different things; they are the same thing at
   * two zoom levels, and this is the proof.
   */
  it('accounts for every pipeline row exactly once', () => {
    const nested = JOURNEY_STEPS.flatMap((step) => [...JOURNEY_STAGES[step]]);
    expect(nested).toEqual(CASE_STAGES.map((stage) => stage.id));
  });

  /*
   * `brief` is the only step the client performs themselves, so the thing it
   * is made of is the screen they are already looking at. A row saying "you
   * are typing" would be the rail narrating the obvious.
   */
  it('gives the brief no rows, because the brief is the screen', () => {
    expect(JOURNEY_STAGES.brief).toEqual([]);
  });

  /*
   * Four of the seven, because the quote is the only part of the pipeline the
   * client drives. Collapsing "we price it", "you get a price" and "you pay"
   * would hide the only step that is theirs.
   */
  it('puts four rows under the quote, which is the step they drive', () => {
    expect(JOURNEY_STAGES.quote).toHaveLength(4);
  });
});

describe('where the rail sits', () => {
  const intake = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');

  /*
   * The same source with every run of whitespace collapsed.
   *
   * These cases are about *where* an element sits, not how Prettier chose to
   * wrap it. Matching the raw text means adding one prop to `<JourneyBar>`
   * pushes it onto four lines and fails four tests that have nothing to say
   * about the change — which is exactly what happened when `accepted` was
   * added for §3's Step E.
   */
  const flat = intake.replace(/\s+/g, ' ');

  /*
   * One stepper, and the two it replaced are gone rather than hidden. A
   * reviewer finding `brief-stepper.tsx` still on disk would reasonably
   * assume there were still two.
   */
  it('has retired both of the steppers it replaced', () => {
    expect(intake).not.toContain('<BriefStepper');
    expect(intake).not.toContain('<CaseProgress');
    expect(
      existsSync(
        join(process.cwd(), 'components/design/intake-v2/brief-stepper.tsx'),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(process.cwd(), 'components/design/intake-v2/case-progress.tsx'),
      ),
    ).toBe(false);
  });

  /*
   * ⭐ Not on the opening screen, in either layout.
   *
   * It was there once, and looked at, that was wrong: nothing has been
   * started, so there is no position to report, and four labels tracking
   * progress through a case that does not exist read as chrome on the one
   * screen whose design is a single centred column.
   *
   * A later attempt had the rail slide in on the first keystroke, taking over
   * from the "how this works" card as the client typed. Worse again: it
   * snatched the explanation away mid-sentence and put a progress tracker on
   * a case that still had not been sent. Hence the flat rule this pins — the
   * rail belongs to the conversation, and the card carries the four words
   * until there is something to track.
   *
   * One of each, both in the two-pane return.
   */
  it('arrives with the conversation, not before it', () => {
    expect(intake.match(/<JourneyRailColumn/g)).toHaveLength(1);
    expect(flat.match(/<JourneyBar phase/g)).toHaveLength(1);

    const openingScreen = intake.slice(
      intake.indexOf("if (phase === 'start') {"),
      intake.indexOf('const docked ='),
    );
    expect(openingScreen).not.toContain('JourneyRail');
    expect(openingScreen).not.toContain('JourneyBar');
    /*
     * And nothing that could bring one in on a keystroke: no handoff flag, no
     * column reserved for it, no timer folding the card away. These are the
     * three pieces the withdrawn version was made of, and each of them is
     * cheap to reintroduce by accident.
     */
    expect(openingScreen).not.toContain('handoff');
    expect(openingScreen).not.toContain('w-[11.25rem]');
    expect(intake).not.toContain('HANDOFF_MS');
    expect(intake).not.toContain('cardGone');
  });

  /*
   * Not a grid track. The rail is a column *outside* the grid, so the four
   * hand-tuned `grid-cols-*` strings and the inline drag override are
   * untouched — they go on dividing whatever width they are given.
   */
  it('stays out of the grid', () => {
    const grid = intake.slice(
      intake.indexOf("'grid min-h-0 flex-1"),
      intake.indexOf('One pane at a time on a phone'),
    );
    expect(grid).not.toContain('JourneyRail');
    expect(grid).not.toContain('pl-[11.25rem]');
  });

  /*
   * ⭐ Outside the 1600 cap, and this is the whole fix.
   *
   * The cap is removed when a document docks, by design — that is what lets
   * the three columns run edge to edge. While the rail depended on the margin
   * that cap left behind, docking deleted the rail's home and it fled to a
   * line at the top of the page. Outside the cap it does not care what the
   * cap does, so the rail is in the same place on every screen of the flow.
   */
  it('sits outside the 1600 cap, not inside it', () => {
    const railAt = flat.indexOf('<JourneyRailColumn phase={phase} accepted=');
    const capAt = flat.indexOf(
      "docked ? 'max-w-none' : 'mx-auto max-w-[1600px]'",
      railAt,
    );
    expect(railAt).toBeGreaterThan(-1);
    expect(capAt).toBeGreaterThan(railAt);
  });

  /*
   * No measurement anywhere. The overlay version bound a `ResizeObserver`
   * once, to an element the opening screen replaced the moment a client
   * typed, and a `ResizeObserver` cannot hear a capped, centred box being
   * moved without being resized. Both failures are unreachable from a column.
   */
  it('decides nothing at runtime', () => {
    expect(intake).not.toContain('useJourneyRailRoom');
    expect(intake).not.toContain('railRoom');
    const rail = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/journey-rail.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rail).not.toContain('ResizeObserver');
    expect(rail).not.toContain('getBoundingClientRect');
  });

  /*
   * One breakpoint decides it, and both halves have to read the same one or
   * the flow shows two rails at once or none at all.
   *
   * Two bars now, one per return, and they have to agree with each other as
   * well as with the column — the opening screen and the two-pane screens are
   * the same rail at the same widths, and a client who types their first
   * sentence on a tablet should not watch the tracker change shape.
   */
  it('swaps the column for the bar at a single breakpoint', () => {
    const rail = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/journey-rail.tsx'),
      'utf8',
    );
    expect(rail).toContain('xl:flex');
    expect(flat.match(/<JourneyBar [^>]*className="xl:hidden"/g)).toHaveLength(
      1,
    );
  });

  /*
   * ⭐ The bar is above the row, not inside the capped content.
   *
   * It is one bar over the whole window, in the same place whatever the panes
   * below are doing — and it has to be outside the 1600 cap for the same
   * reason the column is: the cap is removed when a document docks.
   */
  it('puts the bar above the panes, outside the cap', () => {
    expect(flat).toMatch(
      /<JourneyBar [^>]*className="xl:hidden" \/> <div className="flex min-h-0/,
    );
  });
});

describe('the horizontal bar', () => {
  const source = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/journey-bar.tsx'),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /*
   * ⭐ The thing the whole component exists for: opening it must not move the
   * panes. `absolute` from a `sticky` bar, so the disclosure is drawn over
   * the page rather than inserted above it.
   */
  it('opens over the page rather than pushing it down', () => {
    expect(source).toContain('sticky top-0');
    expect(source).toContain('absolute inset-x-0 top-full');
  });

  /*
   * Sticky is not decoration here. The transcript scrolls, and a stepper that
   * scrolls away is a stepper that is only there when you already know.
   */
  it('stays put while the page scrolls', () => {
    expect(source).toMatch(/sticky top-0 z-\d+/);
  });

  /*
   * ⭐ The active step's sentence is in the bar, so the panel must not print
   * it again an inch lower. That is the same duplicate-heading defect the
   * folded line shipped with, in a new place.
   */
  it('does not repeat the active step’s sentence in what it opens', () => {
    expect(source).toContain('omitLineFor={active}');
  });

  /* Four names, so the bar answers "how many more" and not only "where". */
  it('shows every step, not only the active one', () => {
    expect(source).toContain('JOURNEY_STEPS.map');
    expect(source).toContain('grid-cols-4');
  });

  /*
   * `Document` is the only label that will not fit a 320px phone in four
   * equal columns. It abbreviates rather than shrinking the type: 10px in a
   * law firm's product reads like a disclaimer.
   */
  it('abbreviates the one label that does not fit a phone', () => {
    expect(source).toContain("t('step.documentShort')");
    expect(source).toContain('@max-[400px]:hidden');
    // Its own container, not the window, so the bar is honest at any width it
    // is given rather than only at the widths the viewport can be.
    expect(source).toContain('@container');
  });

  /* No count, here least of all: this is the line §3 wanted "Step 1 of 4" on. */
  it('carries no count', () => {
    expect(source).not.toContain("t('position'");
    expect(source).not.toMatch(/Step \d|of 4/i);
  });

  /*
   * Rule 2, restated as what it actually protects: **never two progress
   * readings on screen at once.**
   *
   * The original form of this was "the bar carries no percentage", written
   * when the brief panel was always beside it. On a phone the panel is a
   * collapsed header, so that reading left the one number a client checks
   * between answers behind a tap, and the header grew a second copy of it —
   * which is the very thing the rule exists to stop.
   *
   * So the percentage moved *into* this bar and out of everywhere else below
   * `lg`. The two halves are hard-pinned here because they are one rule
   * split across two files, and a `lg:hidden` quietly dropped from either
   * side puts two disagreeing figures three rows apart.
   */
  it('shows the brief’s percentage only where the brief is collapsed', () => {
    // Here: phone widths only.
    expect(source).toContain("tBrief('percentDone', { percent })");
    expect(source).toContain(
      'text-muted-foreground shrink-0 font-mono text-xs tabular-nums lg:hidden',
    );
    expect(source).toContain(
      'bg-border absolute inset-x-0 bottom-0 h-[2px] lg:hidden',
    );

    // There: the panel's own copy, from `lg` up.
    const column = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/brief-column.tsx'),
      'utf8',
    );
    expect(column).toContain('flex flex-col gap-3 max-lg:hidden');

    // And nowhere in the collapsed header, which is now only a tap target.
    const summary = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/brief-summary-bar.tsx'),
      'utf8',
    );
    expect(summary).not.toContain('percentDone');
    expect(summary).not.toContain('progressbar');
  });

  /*
   * The active step's sentence is a caption for a stepper the client can
   * already read. It is worth its 24px on a laptop and not on a phone, where
   * it was the third row of status above the first line of content.
   */
  it('drops the step sentence on a phone', () => {
    expect(source).toMatch(/hidden truncate text-xs leading-snug lg:block/);
  });

  /*
   * The bar's second row is the one place the wait's sentence is on screen
   * without a tap on a narrow window, so it has to read the same rule the
   * rail does rather than reaching for `line.${active}` directly.
   */
  it('gets the wait’s sentence from the shared rule', () => {
    expect(source).toContain('journeyLineKey(active, phase)');
    expect(source).not.toContain('line.${active}');
  });

  /* One disclosure, and it says which way it goes. */
  it('is a single disclosure', () => {
    expect(source.match(/aria-expanded=\{open\}/g)).toHaveLength(1);
    expect(source).toContain('aria-controls={panelId}');
  });

  /* Escape and a press elsewhere, because the bar is the width of the page. */
  it('can be closed without finding the bar again', () => {
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain('wrapper.current?.contains');
  });
});

describe('the rail, read as source', () => {
  const source = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/journey-rail.tsx'),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /*
   * Rule 2. The panel already reports progress inside the brief; a second
   * number at a different zoom level six inches away is two progress readings
   * disagreeing in the client's peripheral vision.
   */
  it('carries no counts, no positions and no percentages', () => {
    expect(source).not.toContain("t('position'");
    expect(source).not.toMatch(/Step \d|of 4|%|percent/i);
    expect(source).not.toContain('JOURNEY_STEPS.length}');
  });

  it('marks the current step for assistive tech', () => {
    expect(source).toContain("aria-current={current ? 'step' : undefined}");
  });

  /* Every step opens and closes, including the one the client is on. */
  it('makes every step a disclosure', () => {
    expect(source).toContain('aria-expanded={open}');
    expect(source).toContain('aria-controls={panelId}');
  });

  /* An ordered list of stages is an `ol`. */
  it('is an ordered list', () => {
    expect(source).toContain('<ol');
    expect(source).toContain('<li');
  });

  it('reads its position from journey.ts rather than the phase directly', () => {
    expect(source).toContain('journeyStepFor');
    expect(source).toContain('journeyStepDone');
    expect(source).toContain('journeyLineKey');
    // No phase names in the component: the mapping lives in one place.
    expect(source).not.toContain("'building'");
    expect(source).not.toContain("'sent'");
    expect(source).not.toContain("'sending'");
  });

  /*
   * Rule 1, the half a test can see. Green means settled-and-good and is the
   * rail's only colour; amber and red would be new meanings in the margin.
   */
  it('uses green for done and no other colour at all', () => {
    expect(source).toContain('text-success');
    expect(source).not.toMatch(/-(warning|destructive)\b/);
  });
});
