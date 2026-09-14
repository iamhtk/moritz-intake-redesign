import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { POST as extractPOST } from '@/app/api/extract/route';
import { POST as intakePOST } from '@/app/api/intake/route';
import {
  applyFieldUpdates,
  createBrief,
  missingRequiredKeys,
  type Brief,
} from './brief';
import { fieldsForMatter } from './matter-fields';
import type { IntakeTurn } from './turn-schema';

/**
 * T13a. The turn call asks only about gaps (D6).
 *
 * A prompt rule can regress silently: the sentence stays in the prompt, the
 * model starts re-asking anyway, and nothing fails. The plan calls this the
 * demo moment, so it gets measured instead. The thing being defended is that
 * the document does real work, so if the document arm and the no-document arm
 * converge, this fails.
 *
 * DEVIATION FROM THE TASK AS WRITTEN, and the numbers behind it.
 *
 * T13a asks for "three turns or fewer" with the contract and "six or more"
 * without it. The first half holds. The second half cannot, and not because of
 * anything the model does: the contract matter has only FOUR required fields
 * (matter-type, situation, otherSide, urgency). One question per turn plus a
 * turn to notice it is finished puts the hard ceiling at five. Six is
 * unreachable by construction.
 *
 * Measured against the live API:
 *
 *   contract + "We signed an MSA with Acme and we want out early"   2 turns
 *   the same sentence, no contract                                  3 turns
 *   "I need some legal help", no contract                           5 turns
 *
 * The middle row is the one the task predicted at six or more. It comes in at
 * three because that one sentence already fills three of the four required
 * fields, which is the prompt's "take what you are given" rule working, not
 * failing. So the comparison here is against the vague opening, where the
 * document's contribution is actually visible, and the bound is a gap of two
 * turns rather than a fixed six. Raising the required-field count for a matter
 * would make the task's original numbers reachable; nothing else would.
 *
 * Live, so it is opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`. It spends real tokens
 * (one Haiku extraction, then a handful of Sonnet turns per arm) and needs
 * `ANTHROPIC_API_KEY`, so it stays out of the default run.
 */

const LIVE = process.env.INTAKE_LIVE_TESTS === '1';

const CONTRACT_PDF = fileURLToPath(
  new URL('../../public/demo/northwind-acme-msa.pdf', import.meta.url),
);

/** One line, the way somebody actually opens a conversation. */
const OPENING_MESSAGE =
  'We signed an MSA with Acme and we want to get out of it early.';

/**
 * The other kind of opening line, and the one the old scripted flow inflicted
 * on everybody: a client who has not said anything usable yet.
 *
 * This is the baseline the document is measured against. Against the sentence
 * above there is almost nothing left for a contract to save, because the
 * sentence has already answered three of the four required fields.
 */
const VAGUE_OPENING = 'I need some legal help.';

/**
 * The scripted client.
 *
 * Answers the field being asked about and volunteers nothing else, which is the
 * pessimistic case: a client who offers three facts in one sentence would
 * flatter the no-document arm and hide the gap being measured.
 */
const ANSWERS: Record<string, string> = {
  'matter-type': 'A contract.',
  situation:
    'We signed a warehousing and last-mile distribution agreement and the service levels keep being missed.',
  otherSide: 'Acme Technologies Ltd.',
  outcome: 'A clean exit without paying a penalty.',
  urgency: 'This week.',
};

/**
 * What the client says when the model asked an open question rather than
 * naming a field: they answer the next thing the brief still needs.
 *
 * A script that replied "I am not sure" to anything it did not recognise was
 * measuring its own stubbornness. A cooperative client is also the fair test:
 * if the conversation still drags with someone answering everything put to
 * them, the flow is the problem.
 */
function nextAnswer(brief: Brief): string {
  const missing = missingRequiredKeys(brief)[0];
  return (missing && ANSWERS[missing]) ?? 'That is everything I have.';
}

function newBrief(): Brief {
  return createBrief('contract', fieldsForMatter('contract'));
}

/** Drive the real SSE route and return the validated `done` turn. */
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

  // The stream is `data: {...}` lines; the last `done` carries the turn.
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

  if (!turn) throw new Error('The turn route produced no done event.');
  return turn;
}

/**
 * Read the seeded contract through the real extraction route.
 *
 * `accompanying` mirrors what the app sends: the client's own opening line goes
 * with the document, because that is what lets the reader tell which party is
 * the client and which is the other side.
 */
async function extractContract(
  brief: Brief,
  accompanying = OPENING_MESSAGE,
): Promise<Brief> {
  const base64 = readFileSync(CONTRACT_PDF).toString('base64');
  const response = await extractPOST(
    new Request('http://test/api/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              `The client says: "${accompanying}"`,
              `Read this document and fill in what you can. Field keys: ${brief.fields
                .map((field) => field.key)
                .join(', ')}.`,
            ].join('\n\n'),
          },
        ],
        // Sent on its own as well, exactly as the app sends it.
        clientSays: accompanying,
        documents: [
          {
            name: 'northwind-acme-msa.pdf',
            mediaType: 'application/pdf',
            data: base64,
          },
        ],
      }),
    }),
  );

  const result = (await response.json()) as { fields?: unknown[] };
  expect(response.ok).toBe(true);
  return applyFieldUpdates(brief, result.fields ?? []);
}

const MAX_TURNS = 12;

type Run = {
  turns: number;
  /** What the model asked about, in order. Read when a run goes long. */
  asked: string[];
  reached: boolean;
  brief: Brief;
};

/**
 * Run the conversation to completion and count the assistant turns it took.
 *
 * "Completion" is the model's own `nothingRequiredMissing`, which is what the
 * task names. It is advisory, so the caller also checks the brief really is
 * full, otherwise a model that simply claimed to be finished would pass.
 */
async function conversationLength(
  startingBrief: Brief,
  opening: string = OPENING_MESSAGE,
): Promise<Run> {
  let brief = startingBrief;
  const transcript: { role: string; text: string }[] = [];
  const asked: string[] = [];
  let message = opening;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const result = await runTurn(brief, transcript, message);
    brief = applyFieldUpdates(brief, result.fieldUpdates);
    asked.push(result.askingAbout || '(nothing)');

    transcript.push({ role: 'user', text: message });
    transcript.push({ role: 'assistant', text: result.reply });

    if (result.nothingRequiredMissing) {
      return { turns: turn, asked, reached: true, brief };
    }

    message = ANSWERS[result.askingAbout] ?? nextAnswer(brief);
  }

  return { turns: MAX_TURNS, asked, reached: false, brief };
}

describe.runIf(LIVE)('T13a, the turn call asks only about gaps', () => {
  it(
    'gets there faster with the contract than without it',
    async () => {
      const seeded = await extractContract(newBrief());
      const prefilled = seeded.fields
        .filter((field) => field.required && field.value !== null)
        .map((field) => field.key);

      const withDocument = await conversationLength(seeded);
      const withoutDocument = await conversationLength(
        newBrief(),
        VAGUE_OPENING,
      );

      // Printed because the numbers are the point: a reviewer reading CI wants
      // to see the gap, not just a green tick.
      console.log(
        `T13a: contract pre-filled ${JSON.stringify(prefilled)} and finished in ` +
          `${withDocument.turns} turn(s) ${JSON.stringify(withDocument.asked)}; ` +
          `a vague opening with no contract took ${withoutDocument.turns} turn(s) ` +
          `${JSON.stringify(withoutDocument.asked)}`,
      );

      // Both arms have to actually finish, and finish honestly: the model's own
      // "nothing required is missing" is advisory, so the brief is checked too.
      expect(withDocument.reached).toBe(true);
      expect(withoutDocument.reached).toBe(true);
      expect(missingRequiredKeys(withDocument.brief)).toEqual([]);
      expect(missingRequiredKeys(withoutDocument.brief)).toEqual([]);

      /*
       * The document has to arrive having already done some of the work, or
       * the turn count below is measuring the model's mood rather than D6.
       *
       * One field, not two. Across repeated live runs the seeded contract
       * yields `situation` and `otherSide` most of the time and `otherSide`
       * alone occasionally, so a floor of two is a flake. The turn gap below is
       * what carries the weight; this is here to catch extraction returning
       * nothing at all, which would make the gap meaningless.
       */
      expect(prefilled.length).toBeGreaterThanOrEqual(1);

      // The task's own bound, which holds.
      expect(withDocument.turns).toBeLessThanOrEqual(3);

      // The gap. See the deviation note at the top of this file: the task asked
      // for six turns on the bare arm, which four required fields cannot
      // produce. Two turns of daylight is what the document is actually worth,
      // and a regression that stops extraction feeding the turn call closes it.
      expect(withoutDocument.turns - withDocument.turns).toBeGreaterThanOrEqual(
        2,
      );
    },
    10 * 60 * 1000,
  );

  it(
    'never re-asks a field the document already filled',
    async () => {
      const seeded = await extractContract(newBrief());
      const filled = seeded.fields
        .filter((field) => field.value !== null)
        .map((field) => field.key);

      // The document has to have filled something, or this proves nothing.
      expect(filled.length).toBeGreaterThan(0);

      const run = await conversationLength(seeded);
      console.log(
        `T13a: document filled ${JSON.stringify(filled)}; model asked ${JSON.stringify(run.asked)}`,
      );

      // Decision 6: a field the document filled is finished, confirmed or not.
      for (const key of filled) {
        expect(run.asked).not.toContain(key);
      }
    },
    10 * 60 * 1000,
  );
});
