import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/intake/route';
import { applyFieldUpdates, createBrief } from './brief';
import { fieldsForMatter } from './matter-fields';
import { readEventStream } from './stream-client';
import type { IntakeTurn } from './turn-schema';

/**
 * Two things about a real turn that only a real turn can tell you.
 *
 * THE REQUEST SHAPE. The turn call asks for adaptive thinking, `effort: high`
 * and a JSON schema in one request. Every part of that combination is accepted
 * or rejected by the API rather than by the compiler, and a rejection is a 400
 * on the first message of every intake, so it is worth one live call to know.
 *
 * THE RULE THE PROMPT CANNOT PROVE. "Every turn ends on a question while a
 * required row is empty" is a prompt rule with a deterministic guard behind it
 * (`dead-end.ts`), and the guard's own tests cover the guard. What they cannot
 * cover is whether the *model* still keeps the rule, and the difference matters:
 * a question the model wrote is about this client's case, and the repaired one
 * is the authored fallback. Both are acceptable and one is much better, so this
 * measures the model unaided.
 *
 * The second case is the exact exchange the bug was reported from: a client
 * who replies about the brief rather than answering the question.
 *
 * Live, so it is opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`. It spends real tokens
 * and needs `ANTHROPIC_API_KEY`, so it stays out of the default run.
 */
const LIVE = process.env.INTAKE_LIVE_TESTS === '1';

async function runTurn(brief: ReturnType<typeof createBrief>, message: string) {
  const response = await POST(
    new Request('http://localhost/api/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, transcript: [], message, mode: 'intake' }),
    }),
  );
  let turn: IntakeTurn | null = null;
  let error: string | null = null;
  for await (const event of readEventStream(response)) {
    if (event.type === 'done') turn = event.turn;
    if (event.type === 'error') error = event.kind;
  }
  return { turn, error };
}

describe.runIf(LIVE)('a live turn', () => {
  it('answers a turn with the new effort and thinking params', async () => {
    const brief = createBrief('contract', fieldsForMatter('contract'));
    const { turn, error } = await runTurn(
      brief,
      'We signed an MSA with Acme and we want to get out of it early.',
    );
    expect(error).toBeNull();
    expect(turn).not.toBeNull();
    // Ends on a question, unaided: there was no repair to fall back on here
    // only because the brief still has three empty required rows.
    expect(turn!.reply).toContain('?');
    expect(turn!.askingAbout).not.toBe('');
  }, 120_000);

  it('never leaves a required gap without a question', async () => {
    // Everything filled but the timeline, and a message that answers nothing.
    const base = createBrief('contract', fieldsForMatter('contract'));
    const brief = applyFieldUpdates(base, [
      {
        key: 'matter-type',
        value: 'Contract',
        source: 'client',
        confidence: 9,
      },
      {
        key: 'situation',
        value: 'You want out of an MSA early',
        source: 'client',
        confidence: 9,
      },
      {
        key: 'otherSide',
        value: 'Acme Holdings',
        source: 'client',
        confidence: 9,
      },
    ]);
    const { turn, error } = await runTurn(
      brief,
      'I have checked the what you need on the brief and it is right.',
    );
    expect(error).toBeNull();
    expect(turn!.reply).toContain('?');
    expect(turn!.askingAbout).toBe('urgency');
    /*
     * A remark about the brief is not an answer, so nothing may be written to
     * it. This is the half of the old behaviour that was quietly wrong: the
     * message was treated as an answer to the question that had been asked.
     */
    expect(turn!.fieldUpdates).toEqual([]);
  }, 120_000);
});
