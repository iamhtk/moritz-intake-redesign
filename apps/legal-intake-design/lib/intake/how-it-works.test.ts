import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { JOURNEY_STEPS } from './journey';

/**
 * The "how this works" card on the new-case home, held to the rule that makes
 * it worth having: **it is the journey rail's starting position, not a second
 * story about the same case.**
 *
 * The card it replaces told a three-step story — *Your words / Your brief /
 * Your quote* — that split one step in two, stopped at the price, and quoted a
 * turnaround the rest of the product had already moved off. Read beside the
 * rail, two "how it works" explanations in two vocabularies on adjacent
 * screens is complaint #2 (*"people do not understand the steps, or where they
 * are in them"*) caused rather than answered.
 *
 * Source-read rather than rendered, like the rest of this folder's guards: the
 * claims worth pinning are about which copy key the card reaches for and which
 * colours it is allowed, and neither needs a DOM.
 */
const CARD = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/how-it-works.tsx'),
  'utf8',
);

/** The source with its own prose stripped, for the rules about what it draws. */
const CODE = CARD.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const COPY = messages.intake.howItWorks;

describe('the card says the rail’s four words', () => {
  /*
   * ⭐ The rule the whole rewrite exists for, and the only way to make it
   * structural rather than a note somebody has to remember: the titles are
   * read out of the rail's own copy key, so there is one string per step and
   * the two surfaces cannot drift.
   */
  it('reads its titles from the rail’s own copy, not a second set', () => {
    expect(CODE).toContain('t(`journey.step.${step}`)');
    // A `howItWorks` title block would be the drift this prevents.
    expect(COPY).not.toHaveProperty('oneTitle');
    expect(COPY).not.toHaveProperty('brief');
  });

  /* Four rows, from the same list the rail walks. */
  it('walks the journey rather than a list of its own', () => {
    expect(CODE).toContain('JOURNEY_STEPS.map');
    expect(JOURNEY_STEPS).toEqual(['brief', 'quote', 'lawyer', 'document']);
  });

  /* Every step has a sentence and a time. No half-filled rows. */
  it.each(JOURNEY_STEPS)('has a description and a when for %s', (step) => {
    expect(typeof COPY.description[step]).toBe('string');
    expect(typeof COPY.when[step]).toBe('string');
  });

  /*
   * ⭐ No "who" column, and this is a rule rather than a tidy-up.
   *
   * It was there and it could not be made to say anything true. Ask *who
   * does the work* and the answer is You, Lawyer, Lawyer, Lawyer; ask *who
   * closes the step* and it is You, You, Lawyer, You. Quote is the row that
   * exposes it — `JOURNEY_STAGES` gives that step four rows and three of
   * them are the client's, which is why the same file calls it "the only
   * part of the pipeline the client drives". Labelling it *a lawyer*
   * contradicted the tracker this card exists to introduce.
   *
   * And it restated the sentence beside it in all four rows. One muted time
   * per row is the only thing on the right the left does not already say.
   */
  it('carries no who column, only the time', () => {
    expect(COPY).not.toHaveProperty('who');
    expect(CODE).not.toContain('howItWorks.who');
    expect(CODE).toContain('t(`howItWorks.when.${step}`)');
  });
});

describe('what the card promises', () => {
  /*
   * ⭐ 24 hours, and the same 24 hours the rail gives in
   * `intake.journey.note.quote`. The old card promised a quarter of that.
   *
   * The absence of the superseded wording is no longer asserted here — it is
   * one line of one file, and the figure had leaked into eight copy strings,
   * the waiting system prompt and a hardcoded card fallback. A per-component
   * check could never have found those. `turnaround.test.ts` owns that
   * question for the whole app now.
   */
  it('says 24 hours on the quote, and says it once', () => {
    expect(COPY.when.quote).toContain('24 hours');
    expect(messages.intake.journey.note.quote).toContain('24 hours');
  });

  /*
   * ⭐ No invented number on the document. This is the flow's existing rule,
   * already written on the confirmation, and saying it out loud where a
   * competitor prints a fake estimate is the more premium answer.
   */
  it('refuses to estimate the document rather than guessing', () => {
    expect(COPY.when.document.toLowerCase()).toContain('no estimate');
    expect(COPY.when.document).not.toMatch(/\d/);
  });

  /* The case does not end at the price: a lawyer and a document are on it. */
  it('carries the two steps the old card left off', () => {
    expect(COPY.description.lawyer).not.toBe('');
    expect(COPY.description.document).not.toBe('');
  });

  /*
   * The document row is a handoff with three parties in it, and the middle
   * one is the easiest to lose. An earlier cut of this card read “They write
   * it and send you the finished document”, which is the lawyer posting work
   * straight to the client — it drops the review the footer immediately
   * promises (“Our agents do the first pass. Our lawyers finish it”) and the
   * one Moritz actually runs. Whoever shortens these lines next should have
   * to argue with a failing test rather than rediscover this.
   */
  it('names the check between the drafting and the delivery', () => {
    expect(COPY.description.document.toLowerCase()).toContain('we check it');
  });

  /*
   * Their own words for the division of labour, not the video plan's
   * "AI does 80%". Nobody has measured that, and a percentage is the most
   * falsifiable shape a claim can take.
   */
  it('states the division of labour without a percentage', () => {
    expect(COPY.footer).toBe(
      'Our agents do the first pass. Our lawyers finish it.',
    );
    expect(JSON.stringify(COPY)).not.toMatch(/%|per cent|percent/i);
  });
});

describe('a real face, following the matter', () => {
  /*
   * The same lookup the lawyer note, the confirmation, the quote and the case
   * handoff use. A second rule for "who reads this" is two people claiming the
   * same matter on one screen.
   */
  it('resolves the face through the shared lead lookup', () => {
    expect(CODE).toContain('leadForMatter(matterId)');
    expect(CODE).not.toContain('ONBOARDING_LAWYERS');
  });

  /*
   * Quote only, now that the rows carry no written who.
   *
   * The face was on Lawyer as well while each row had a label — the same
   * person twice said *whoever prices it takes it*, which is worth saying.
   * Unlabelled, a second photograph down the same edge reads as either a
   * different person or as decoration, and this card has no decoration in
   * it. Brief and Document are the client, so neither can have one at all.
   */
  it('puts a face on the one row a stranger is on', () => {
    expect(CODE).toContain(
      "const FACE_STEPS: readonly JourneyStepId[] = ['quote']",
    );
  });

  /*
   * 22px, and clipped. `AVATAR_FRAMING` crops these headshots with a `scale`
   * and the foundation `Avatar` root deliberately does not clip, which is how
   * one lawyer's photograph once covered his own name.
   */
  it('draws the face small and clipped', () => {
    expect(CODE).toContain('size-[22px]');
    expect(CODE).toContain('overflow-hidden');
  });
});

describe('the card’s restraint', () => {
  /*
   * ⭐ One colour, and it is the token. `bg-mz-gradient-gold` bottoms out at
   * `#f1f0dd`, one of the four off-palette ambers the brand audit picked out,
   * so the card whose rule is "one colour" was shipping two and a half.
   */
  it('is the flat --mz-gold token and nothing off-palette', () => {
    expect(CODE).toContain('bg-mz-gold');
    expect(CODE).not.toContain('bg-mz-gradient-gold');
    for (const amber of ['#e8a952', '#c0703d', '#a17436', '#f1f0dd']) {
      expect(CODE).not.toContain(amber);
    }
  });

  /*
   * No numbers, the same rule the rail keeps. A card that numbers the four
   * steps teaches a vocabulary the tracker then refuses to speak.
   */
  it('carries no numerals, no counts and no percentages', () => {
    expect(CODE).not.toContain('numeral');
    expect(CODE).not.toMatch(/'0[123]'/);
    expect(CODE).not.toMatch(/Step \d|of 4|percent/i);
  });

  /*
   * Green means *settled, and good*, and nothing on this card is settled: it
   * only exists before the first word is typed. `colour-restraint.test.ts`
   * enforces the same rule folder-wide; this states it where the filled black
   * dot could most easily have become a green tick.
   */
  it('has no green on it, because nothing here is done yet', () => {
    expect(CODE).not.toMatch(/-success\b|--mz-green/);
    expect(CODE).toContain('border-foreground bg-foreground');
  });

  /*
   * Audit item 66: this file shipped four treatments at once on the explicit
   * understanding, in its own header, that three of them "come out again".
   * They never did until now.
   */
  it('is one card, not four unrendered treatments', () => {
    expect(CARD.match(/^export function /gm)).toHaveLength(1);
    expect(CARD).toContain('export function HowItWorksCard');
  });
});
