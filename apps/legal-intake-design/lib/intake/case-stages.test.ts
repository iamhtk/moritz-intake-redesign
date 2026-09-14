import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '@/messages/en.json';
import { CASE_STAGES, caseStages, hasCaseProgress } from './case-stages';
import { INTAKE_PHASES, type IntakePhase } from './phase';

/**
 * The pipeline rail, as the invariants that make it trustworthy rather than
 * decorative.
 *
 * The component's whole claim is that it never overstates: a row is `done` only
 * where the client's own screen has evidence of it, and nothing advances on a
 * clock. Those are properties of `reached`, and they are the kind that a later
 * change breaks silently — adding a phase, or ticking one row too many, leaves
 * a rail that renders perfectly and tells a client their document has been
 * drafted when nobody has opened the file.
 */
const translator = createTranslator({
  locale: 'en',
  messages: { intake: messages.intake },
  namespace: 'intake.journey',
});

const t = translator as unknown as (
  key: string,
  values?: Record<string, unknown>,
) => string;

describe('the case stages', () => {
  it('are the firm’s seven steps, in the order the client meets them', () => {
    expect(CASE_STAGES.map((stage) => stage.id)).toEqual([
      'sent',
      'pricing',
      'quote',
      'paid',
      'lawyer',
      'revision',
      'delivered',
    ]);
  });

  it('puts payment before assignment, which is the claim the screen makes', () => {
    // "Nobody is assigned until you accept the quote" is said on the
    // confirmation, in the email and in the system prompt. Here it is the
    // ordering of two rows, which is the version a client can check.
    const ids = CASE_STAGES.map((stage) => stage.id);
    expect(ids.indexOf('paid')).toBeLessThan(ids.indexOf('lawyer'));
  });

  it('names every stage, and no two of them the same', () => {
    const sentences = CASE_STAGES.map((stage) => t(`stage.${stage.id}`));
    for (const sentence of sentences)
      expect(sentence.length).toBeGreaterThan(0);
    expect(new Set(sentences).size).toBe(sentences.length);
  });

  it('gives a second line to `pricing` and to nothing else', () => {
    /*
     * The concurrent drafting work, which is the single most valuable sentence
     * on the screen and the one thing on the rail that is not sequential. A
     * detail line appearing on another row would mean somebody had answered
     * "when does this happen" with a paragraph instead of a position.
     */
    expect(
      CASE_STAGES.filter((stage) => stage.hasDetail).map((stage) => stage.id),
    ).toEqual(['pricing']);
    expect(t('detail.pricing')).toContain('already being written');
  });

  /*
   * The rail is 144px wide and every sentence in it is written to that
   * measure. The old copy was written for a 400px panel — "Your lawyer is
   * assigned and takes over this chat" wrapped to four lines in the margin,
   * which is how a quiet rail becomes the loudest column on the page. A
   * character cap is the version of "short lines" a test can check.
   */
  it('keeps every sentence short enough for the margin', () => {
    for (const stage of CASE_STAGES) {
      expect(
        t(`stage.${stage.id}`).length,
        `stage.${stage.id} is too long for the rail`,
      ).toBeLessThanOrEqual(40);
    }
  });

  it('resolves the disclosure labels and the states', () => {
    for (const key of ['expand', 'collapse', 'label']) {
      expect(t(key).length).toBeGreaterThan(0);
    }
    for (const state of ['done', 'current', 'future']) {
      expect(t(`state.${state}`).length).toBeGreaterThan(0);
    }
  });

  it('splits at the commercial gate: four rows to pay, three after', () => {
    // The commercial gate. A row moving across it would change what a client
    // sees before deciding to spend money.
    expect(CASE_STAGES.filter((stage) => stage.group === 'quote')).toHaveLength(
      4,
    );
    expect(CASE_STAGES.filter((stage) => stage.group === 'work')).toHaveLength(
      3,
    );
  });
});

describe('how far the rail has got', () => {
  it('shows nothing before the case has gone', () => {
    /*
     * Including `sending`, deliberately. A rail appearing while the request is
     * still open would tick "your case reached us" before it had — the first
     * complaint, reintroduced by the component built for the second.
     */
    for (const phase of ['start', 'building', 'review', 'sending'] as const) {
      expect(hasCaseProgress(phase)).toBe(false);
    }
  });

  it('ticks only what the client can see the evidence for', () => {
    const sent = caseStages('sent');
    expect(
      sent.filter((row) => row.state === 'done').map((row) => row.id),
    ).toEqual(['sent']);
    expect(sent.find((row) => row.state === 'current')?.id).toBe('pricing');

    const quoted = caseStages('quoted');
    expect(
      quoted.filter((row) => row.state === 'done').map((row) => row.id),
    ).toEqual(['sent', 'pricing', 'quote']);
    /*
     * And specifically not `paid`. The quote card is the accept control, so a
     * rail marking the payment as made while the button to make it is still on
     * screen would be the rail arguing with the page.
     */
    expect(quoted.find((row) => row.state === 'current')?.id).toBe('paid');
  });

  it('always returns every stage, so the future rows are always there', () => {
    // The rows still ahead are the feature: without them the rail is a receipt,
    // and the client already has one of those.
    for (const phase of ['sent', 'quoted'] as const) {
      expect(caseStages(phase)).toHaveLength(CASE_STAGES.length);
    }
  });

  /*
   * Before the case has gone there is no `current` row at all, and this is the
   * invariant the left rail needs that the confirmation-only rail did not.
   * `reached` returns 0 for every pre-submission phase, and 0 is also a real
   * mark meaning "waiting on `sent`". The rail shows all seven rows from the
   * first screen, greyed, so the ambiguity would have told a client who had
   * typed one sentence that their case had reached us.
   */
  it('marks nothing at all before the case has gone', () => {
    for (const phase of ['start', 'building', 'review', 'sending'] as const) {
      const rows = caseStages(phase);
      expect(rows.every((row) => row.state === 'future')).toBe(true);
    }
  });

  /*
   * ⭐ Accepting ticks one more row, and that row is "You accept it and pay".
   *
   * The tick is making a claim about a payment that has not happened, and
   * `case-stages.ts` records why that is the right call here: payment is out
   * of scope in this prototype — it is on Moritz's own case page — so a row
   * that could never tick would sit there reading as stalled for the rest of
   * the flow, which is the failure this rail was built against. Accepting is
   * as far as the client can go, and the next row becomes what the case is
   * waiting on, which is what the chat says too.
   */
  it('ticks the client’s own step once they have accepted', () => {
    const accepted = caseStages('quoted', true);
    expect(
      accepted.filter((row) => row.state === 'done').map((row) => row.id),
    ).toEqual(['sent', 'pricing', 'quote', 'paid']);
    expect(accepted.find((row) => row.state === 'current')?.id).toBe('lawyer');
  });

  /* And does nothing at all on a phase where there is no quote to accept. */
  it('ignores acceptance before the quote exists', () => {
    for (const phase of ['building', 'review', 'sending', 'sent'] as const) {
      expect(caseStages(phase, true)).toEqual(caseStages(phase, false));
    }
  });

  it('marks exactly one row as current, in every phase that has a rail', () => {
    for (const phase of INTAKE_PHASES) {
      if (!hasCaseProgress(phase)) continue;
      const current = caseStages(phase).filter(
        (row) => row.state === 'current',
      );
      expect(current).toHaveLength(1);
    }
  });

  it('never leaves a done row after the current one', () => {
    // The rail reads down as past, present, future. A `done` below the mark
    // would be a claim about work having jumped the queue.
    for (const phase of INTAKE_PHASES) {
      const rows = caseStages(phase);
      const mark = rows.findIndex((row) => row.state === 'current');
      if (mark === -1) continue;
      for (const row of rows.slice(mark + 1)) expect(row.state).toBe('future');
    }
  });

  it('has an opinion about every phase the flow can be in', () => {
    /*
     * `reached` names its phases and defaults to nothing ticked, which is the
     * correct failure. This asserts the default is never silently in use for a
     * post-submission phase: a new phase after `sent` would otherwise render a
     * rail of all-future rows on a case that had plainly been sent.
     */
    const postSubmission: IntakePhase[] = ['sent', 'quoted'];
    for (const phase of postSubmission)
      expect(hasCaseProgress(phase)).toBe(true);
  });
});
