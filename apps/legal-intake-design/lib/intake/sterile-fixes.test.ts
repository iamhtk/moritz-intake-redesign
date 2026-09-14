import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import {
  MATTER_CHIPS,
  MATTER_FLOWS,
} from '@/components/design/new-case/matters';

/**
 * The four sterile-screen fixes that are copy or markup rather than motion.
 *
 * `animations.md` §4 is a list of things that make the flow read as software
 * rather than as a firm, and every one of them is the kind of change that
 * comes back: a greeting reverts on a copy pass, a caption gets dropped as
 * clutter, a rotation gets simplified to one string. None of them would fail
 * a type check or a render test, so they get asserted here.
 */

const COPY = messages.intake;

/*
 * #45. "Welcome back" claims a relationship a first-time client does not
 * have, and Garzai's brief is explicit that clients "find us and start a case
 * themselves" — the greeting was welcoming them back to a product they had
 * never opened.
 */
describe('the greeting on the start screen', () => {
  it('does not welcome a first-time client back', () => {
    expect(COPY.start.heading.toLowerCase()).not.toContain('welcome back');
    expect(COPY.start.headingAnonymous.toLowerCase()).not.toContain(
      'welcome back',
    );
  });

  it('still greets them by name when there is one', () => {
    expect(COPY.start.heading).toContain('{firstName}');
  });
});

/*
 * #47. "Procurement" and "M&A" are the names of practice areas, not of
 * problems. A founder holding a supplier dispute cannot pick from a taxonomy
 * they have never seen, and the row was asking them to.
 */
describe('the matter chips', () => {
  it('gives every chip a plain-words line under it', () => {
    for (const chip of MATTER_CHIPS) {
      expect(chip.hint, `${chip.label} has no hint`).toBeTruthy();
    }
  });

  it('does not just restate the label', () => {
    for (const chip of MATTER_CHIPS) {
      expect(chip.hint?.toLowerCase()).not.toBe(chip.label.toLowerCase());
    }
  });

  it('reads the hint off the flow, so label and hint cannot drift', () => {
    for (const chip of MATTER_CHIPS) {
      const flow = MATTER_FLOWS[chip.value as keyof typeof MATTER_FLOWS];
      expect(chip.hint).toBe(flow.chipHint);
    }
  });

  /*
   * The hint shows on hover and on keyboard focus, and a tooltip reaches
   * neither a touch client nor a screen reader that never opens it. So the
   * same words are also a visually hidden sibling the button points at with
   * `aria-describedby` — the half of #47 that is easy to lose when a caption
   * becomes a tooltip.
   */
  it('reaches the clients a tooltip cannot', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/design/intake-v2/suggestion-chips.tsx'),
      'utf8',
    );
    expect(source).toContain('aria-describedby');
    expect(source).toContain('sr-only');
    expect(source).toContain('TooltipTrigger');
  });
});

/*
 * #48 / #63. Three real first sentences, and an instruction frame that keeps
 * saying a document can be handed over.
 */
describe('the composer placeholder', () => {
  const frames = [
    COPY.chat.placeholderFirst,
    COPY.chat.placeholderExampleOne,
    COPY.chat.placeholderExampleTwo,
    COPY.chat.placeholderExampleThree,
  ];

  it('has an instruction and three examples', () => {
    expect(new Set(frames).size).toBe(4);
    for (const frame of frames) expect(frame.length).toBeGreaterThan(0);
  });

  /*
   * Frame 0 is load-bearing beyond this component: the start screen's copy
   * was cut on the understanding that the placeholder is where "you can hand
   * over a document" gets said. See the comment above the greeting in
   * `intake-v2.tsx`.
   */
  it('keeps the document affordance on the frame reduced motion parks on', () => {
    expect(frames[0]?.toLowerCase()).toContain('document');
  });

  it('writes the examples as a client would, not as a form would', () => {
    for (const example of frames.slice(1)) {
      expect(example).toMatch(/^(I|We|A|My|Our)\b/);
    }
  });

  /* Reduced motion parks on frame 0 rather than holding whatever was up. */
  it('parks on the first frame under reduced motion', () => {
    const source = readFileSync(
      join(
        process.cwd(),
        'components/design/intake-v2/use-rotating-placeholder.ts',
      ),
      'utf8',
    );
    expect(source).toContain('prefers-reduced-motion: reduce');
    expect(source).toContain('setIndex(0)');
  });
});

/*
 * #51. The serif is how this flow marks the product speaking rather than
 * labelling. "Case sent" is the one sentence the client came to read.
 */
describe('the serif moments', () => {
  const read = (path: string) =>
    readFileSync(join(process.cwd(), path), 'utf8');

  it('sets "Case sent" in the serif', () => {
    const source = read('components/design/intake-v2/sent-confirmation.tsx');
    const heading = source.slice(source.indexOf('ref={headingRef}'));
    expect(heading.slice(0, 300)).toContain('font-serif');
  });

  it('keeps the lawyer’s one-line bio in the serif', () => {
    expect(
      read('components/design/intake-v2/intake-lawyer-note.tsx'),
    ).toContain('font-serif');
  });
});

/*
 * #18 and #74. The gate on the primary action, which is one rule and was two
 * implementations: "Send to Moritz" went outline-until-ready and pointed at
 * the first outstanding row, and "Review and send" — the button the client
 * stares at for the whole middle of the flow — was still a `disabled` grey
 * rectangle that did nothing when pressed.
 *
 * Asserted on the source because there is nothing to render: the difference
 * between the two treatments is an attribute and a variant, and both spellings
 * type-check and both render. Only the second one is a dead end.
 */
describe('the primary action’s gate', () => {
  const source = readFileSync(
    join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
    'utf8',
  );
  const footer = source.slice(
    source.indexOf('const gatedAction ='),
    source.indexOf('const briefFooter ='),
  );

  it('never disables the way through', () => {
    expect(footer).not.toContain('disabled=');
  });

  it('is outline until it is ready, then fills', () => {
    expect(footer).toContain("variant={ready ? 'default' : 'outline'}");
    expect(footer).toContain("filled && 'mz-animate-fill-lr'");
  });

  it('points at the first blocker rather than doing nothing', () => {
    expect(footer).toContain('onClick={ready ? onReady : pointAtBlocker}');
  });

  it('says why, out loud, now that the press does something', () => {
    expect(footer).toContain('role="status"');
  });

  /*
   * The half that is easy to lose: both buttons have to come through the one
   * helper, or the next change to the rule lands on one of them again.
   */
  it('is the same rule for both buttons', () => {
    expect(footer).toContain("t('send.action')");
    expect(footer).toContain("t('quote.action')");
    // Exactly two call sites: the definition reads `gatedAction = (`.
    expect(footer.match(/gatedAction\(/g)?.length).toBe(2);
  });

  /*
   * On a phone the brief is collapsed through `building` and hidden with
   * `hidden` rather than unmounted, so pointing at a row without opening it
   * scrolls and focuses an element with `display: none` — the dead end
   * surviving on the device most likely to meet it.
   */
  it('opens the brief before pointing into it', () => {
    const point = source.slice(
      source.indexOf('const pointAtBlocker ='),
      source.indexOf('}, [blocking]);'),
    );
    expect(point).toContain('setBriefOpenOnMobile(true)');
  });
});
