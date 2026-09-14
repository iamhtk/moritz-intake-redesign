import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';

/**
 * The quote arrives when a reviewer asks for it, and never on its own.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE DEFECT THIS FILE EXISTS TO KEEP FIXED.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `QUOTE_ARRIVES_MS = 12_000`, armed by every real submission. Twelve seconds
 * after Send, the confirmation replaced itself with the quote screen. The
 * confirmation is the last screen of the required flow and the answer to the
 * brief's first complaint — "people do not understand when a case has
 * actually been submitted" — and it had a twelve-second fuse on it. A
 * reviewer reading it lost it mid-sentence.
 *
 * Two things have to stay true, and a timer is the kind of thing that comes
 * back because each individual argument for it is reasonable:
 *
 *   1. Nothing moves the flow past the confirmation on its own.
 *   2. The control that does move it cannot read as a feature. "Customers can
 *      summon their own quote?" is a worse impression than not showing the
 *      quote at all, because it would say the flow does not know that a
 *      person writes the price.
 */

const INTAKE = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/intake-v2.tsx'),
  'utf8',
);
const code = INTAKE.replace(/\/\*[\s\S]*?\*\//g, '').replace(
  /^\s*\/\/.*$/gm,
  '',
);

const CONFIRMATION = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/sent-confirmation.tsx'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

/** The treatment itself, shared by both directions so they cannot drift. */
const LINK = readFileSync(
  join(process.cwd(), 'components/design/intake-v2/prototype-link.tsx'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const t = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake.prototype',
}) as unknown as (key: string) => string;

describe('nothing arrives on a clock', () => {
  /* ⭐ The timer, and the two refs that armed and cancelled it. */
  it('has no quote timer left anywhere', () => {
    expect(code).not.toContain('QUOTE_ARRIVES_MS');
    expect(code).not.toContain('expectQuote');
    expect(code).not.toContain('quoteTimer');
  });

  /*
   * Every timer left in the file is one of two named ones, and neither of
   * them moves the phase. `sendingTimer` is the wait Garzai asked for — "the
   * design has to survive some gap between the click and the case actually
   * being submitted" — and `announceTimer` delays a screen-reader
   * announcement by a few hundred milliseconds. An anonymous timer here is
   * how the old one got in.
   */
  it('has no timer that is not one of the two named waits', () => {
    const timers = code.match(/(\w+)\.current = window\.setTimeout\(/g) ?? [];
    const all = code.match(/window\.setTimeout\(/g) ?? [];
    expect(timers).toHaveLength(all.length);
    expect([...new Set(timers)].sort()).toEqual([
      'announceTimer.current = window.setTimeout(',
      'sendingTimer.current = window.setTimeout(',
    ]);
  });

  /* ⭐ And the phase reaching `quoted` happens in exactly one place. */
  it('moves to the quote from exactly one place', () => {
    expect(code.match(/setStage\('quoted'\)/g)).toHaveLength(1);
    const body = code.slice(
      code.indexOf('const advanceToQuote = useCallback('),
      code.indexOf('const onQuoteResponse'),
    );
    expect(body).toContain("setStage('quoted')");
  });

  /* The phase can only move past `sent` because something was pressed. */
  it('moves to the quote from a callback, not an effect', () => {
    expect(code).toContain('const advanceToQuote = useCallback(');
    expect(code).toContain('onSkipToQuote={advanceToQuote}');
    const body = code.slice(
      code.indexOf('const advanceToQuote = useCallback('),
      code.indexOf('const onQuoteResponse'),
    );
    expect(body).not.toContain('setTimeout');
    // Once per sent case, whatever the press does.
    expect(body).toContain("if (stage !== 'sent') return;");
  });

  /*
   * §3 asks for three things in order, so the reviewer watches the machinery
   * work rather than arriving at a finished state: the rail ticks, the chat
   * says so, the bell raises it and the card appears.
   */
  it('still does all three things, in order', () => {
    const body = code.slice(
      code.indexOf('const advanceToQuote = useCallback('),
      code.indexOf('const onQuoteResponse'),
    );
    const order = [
      body.indexOf("setStage('quoted')"),
      body.indexOf("t('quote.arrivedChat'"),
      body.indexOf('raisePortalNotification'),
    ];
    for (const index of order) expect(index).toBeGreaterThan(-1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('the control does not read as a feature', () => {
  /*
   * ⭐ "Prototype only" before the thing it does, not after. A reviewer
   * skimming reads the first two words, and those two words are the whole
   * job of this element.
   */
  it('says what it is before it says what it does', () => {
    const label = LINK.indexOf("t('label')");
    const action = LINK.indexOf('t(action)');
    expect(label).toBeGreaterThan(-1);
    expect(action).toBeGreaterThan(label);
    expect(t('label').toLowerCase()).toContain('prototype');
  });

  /*
   * Not a `Button`. The flow's buttons are the product, and this is the one
   * element on the screen that is not — no border, no fill, muted, at the
   * bottom of the smallest type scale.
   */
  it('is not built out of the product’s button', () => {
    expect(LINK).not.toContain('<Button');
    expect(LINK).toContain('text-muted-foreground');
    expect(LINK).toContain('text-xs');
  });

  /*
   * ⭐ One component for both directions, so a reviewer who has learned what
   * this treatment means on the confirmation does not have to learn it again
   * on the quote screen — and so the two cannot drift apart.
   */
  it('is one treatment, used in both directions', () => {
    expect(CONFIRMATION).toContain('<PrototypeLink');
    expect(code.match(/<PrototypeLink/g) ?? []).not.toHaveLength(0);
    // Neither screen hand-rolls its own version of the markup.
    expect(CONFIRMATION).not.toContain('uppercase tracking-[0.14em]');
    expect(code).not.toContain('uppercase tracking-[0.14em]');
  });

  /*
   * Last on the screen. Beside "Start another case" it would be one of the
   * choices; under it, at the foot of the column and directly above the
   * sticky "Go to case", it is an aside — which is where §3 puts it.
   */
  it('is the last thing in the column, under the way out', () => {
    expect(CONFIRMATION.indexOf('onSkipToQuote}')).toBeGreaterThan(
      CONFIRMATION.indexOf("t('startAnother')"),
    );
  });

  /*
   * ⭐ Not a one-way door. A reviewer who skips ahead and then wants to
   * re-read the confirmation would otherwise have to start a case again, and
   * the accepted state after "Accept and start" is the furthest this
   * prototype goes — the easiest place of all to get stranded.
   */
  it('goes back as well as forward, from both quote screens', () => {
    expect(code).toContain('const returnToConfirmation = useCallback(');
    expect(code.match(/action="backToConfirmation"/g)).toHaveLength(2);
    /*
     * Outside `QuoteCard`, so accepting does not take the way back with it.
     * `quoteAccepted` changes what the card draws inside itself and nothing
     * about the phase, so a link rendered in there would vanish on exactly
     * the screen it is most needed.
     */
    const cardOpens = code.indexOf('<QuoteCard');
    const cardCloses = code.indexOf('/>', cardOpens);
    expect(code.slice(cardOpens, cardCloses)).not.toContain('PrototypeLink');
    expect(code.indexOf('action="backToConfirmation"')).toBeGreaterThan(
      cardCloses,
    );
  });

  /*
   * ⭐ The rewind takes the conversation with the phase.
   *
   * Without it the rail ticks back to "a lawyer prices the work" while the
   * chat two inches away still says the price arrived — a contradiction on
   * the screen a reviewer is judging.
   */
  it('unsays the quote line when it winds the phase back', () => {
    const body = code.slice(
      code.indexOf('const returnToConfirmation = useCallback('),
      code.indexOf('const onQuoteResponse'),
    );
    expect(body).toContain('rewindTo(quoteLine.current)');
    expect(body).toContain("setStage('sent')");
    // Accepting outlives the phase, so it has to be cleared by hand or the
    // button a reviewer came back to press is already spent.
    expect(body).toContain('setQuoteAccepted(false)');
    expect(code).toContain('quoteLine.current = say(');
  });

  /*
   * And nothing else can un-say anything. A transcript is the record the case
   * is built from, so the primitive exists for the prototype control and for
   * nothing in the product.
   */
  it('keeps the rewind out of every product path', () => {
    expect(code.match(/rewindTo\(/g)).toHaveLength(1);
  });

  /* `?demo=quote` stays the second way in, for a reviewer with a link. */
  it('leaves the demo route alone', () => {
    expect(code).toContain('if (seed.quote) setQuoteOutcome(seed.quote);');
  });
});
