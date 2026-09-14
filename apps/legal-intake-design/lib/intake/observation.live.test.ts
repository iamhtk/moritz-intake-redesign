import { describe, expect, it } from 'vitest';
import { POST as intakePOST } from '@/app/api/intake/route';
import { createBrief, noteObservation, type Brief } from './brief';
import { fieldsForMatter } from './matter-fields';
import type { IntakeTurn } from './turn-schema';

/**
 * Item 6, against the live model.
 *
 * The rule that needs measuring is the negative one. "At most one per intake"
 * is enforced in code and unit tested, and "names the two facts" is easy to
 * satisfy. The rule that can only fail silently is the last one: an observation
 * invented to seem clever is worse than silence, and a prompt asking for
 * restraint is exactly the kind of instruction that erodes without anything
 * going red.
 *
 * So both arms run. One case genuinely contradicts itself, one does not, and
 * the test is that the model can tell the difference. The silent arm is the
 * important one, because that is the behaviour every ordinary intake gets.
 *
 * Live and opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`. Spends real Sonnet tokens.
 */

const LIVE = process.env.INTAKE_LIVE_TESTS === '1';

function employmentBrief(): Brief {
  return createBrief('employment', fieldsForMatter('employment'));
}

async function runTurn(
  brief: Brief,
  transcript: { role: string; text: string }[],
  message: string,
): Promise<IntakeTurn> {
  const response = await intakePOST(
    new Request('http://test/api/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, transcript, message }),
    }),
  );
  expect(response.ok).toBe(true);
  const body = await response.text();

  let turn: IntakeTurn | null = null;
  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6)) as {
      type: string;
      turn?: IntakeTurn;
      // The route sends a classified kind, never a message (T32). The real
      // reason is in the server log; the kind is what the client would see.
      kind?: string;
    };
    if (event.type === 'error') {
      throw new Error(`the turn route failed: ${event.kind ?? 'unknown'}`);
    }
    if (event.type === 'done' && event.turn) turn = event.turn;
  }
  if (!turn) throw new Error('stream carried no done event');
  return turn;
}

/** Two facts that really do disagree: the stated reason and what they were told. */
const CONTRADICTION =
  'IBM withdrew my offer. Their letter says the reason was that they cannot ' +
  'sponsor my visa. But I told their recruiter about my visa situation in the ' +
  'first interview, back in June, and they said it would be fine.';

/** A complete, ordinary matter with nothing in tension. */
const NO_CONTRADICTION =
  'I accepted an offer from IBM in June and they withdrew it last week, two ' +
  'weeks before my start date. They said the role had been cut in a budget ' +
  'freeze. I want to know where I stand. I need an answer this week.';

describe.runIf(LIVE)('item 6, the observation', () => {
  it('notices two facts that genuinely disagree', async () => {
    const turn = await runTurn(employmentBrief(), [], CONTRADICTION);
    console.log(
      `CONTRADICTION -> observation: ${turn.observation || '(none)'}`,
    );
    expect(turn.observation).not.toBe('');

    const said = turn.observation.toLowerCase();
    // It has to name both facts, not gesture at "an inconsistency".
    expect(said).toMatch(/visa|sponsor/);
    // And say it has been recorded for a person.
    expect(said).toMatch(/lawyer|noted|note/);

    /*
     * The hard prohibitions. These are the words an observation turns into
     * once it stops being a note and starts being advice, which is the line
     * item 6 draws and the one thing this feature must never cross.
     */
    for (const banned of [
      'you have a case',
      'you may have a claim',
      'you should',
      'i recommend',
      'this is illegal',
      'unlawful',
      'discriminat',
      'strong claim',
      'red flag',
      'suspicious',
      'in your favour',
      'in your favor',
    ]) {
      expect(said, `must not say "${banned}"`).not.toContain(banned);
    }
  }, 120_000);

  it('stays silent when nothing genuinely disagrees', async () => {
    const turn = await runTurn(employmentBrief(), [], NO_CONTRADICTION);
    console.log(
      `NO CONTRADICTION -> observation: ${turn.observation || '(none)'}`,
    );
    expect(turn.observation).toBe('');
  }, 120_000);

  it('does not offer a second one once the slot is spent', async () => {
    const spent = noteObservation(
      employmentBrief(),
      'The letter gives sponsorship as the reason, and you told them in June, so I have noted that for the lawyer.',
    );
    const turn = await runTurn(spent, [], CONTRADICTION);
    console.log(`SLOT SPENT -> observation: ${turn.observation || '(none)'}`);
    // The app would drop it anyway; this checks the model was told, and
    // listened, so the tokens are not spent generating a discarded sentence.
    expect(turn.observation).toBe('');
  }, 120_000);
});
