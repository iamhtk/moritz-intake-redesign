import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { POST as extractPOST } from '@/app/api/extract/route';
import { POST as intakePOST } from '@/app/api/intake/route';
import { POST as recapPOST } from '@/app/api/recap/route';
import {
  applyFieldUpdates,
  createBrief,
  missingRequiredKeys,
  type Brief,
  type BriefField,
} from './brief';
import { fieldsForMatter } from './matter-fields';
import { documentsOnlyMessage } from './outgoing-turn';
import { canEnterReview, canSend } from './phase';
import type { IntakeTurn } from './turn-schema';

/**
 * T36. Five end-to-end runs against the live API (Sun 14).
 *
 * Every other test in this folder holds one rule still and checks it. This one
 * does the opposite: it walks the whole flow five times, the five ways a client
 * actually opens a conversation, and reports what the model did. The task's
 * instruction for a run that wanders is to tighten the prompt for that field
 * and never to add scripted rails back in, so the assertions here are the
 * invariants the flow must not break, and everything else is printed for a
 * person to read.
 *
 * The five runs, and the thing each one exists to catch:
 *
 *   1. contract + a sentence     the demo path, and the party bug below
 *   2. contract, no words        a drop with nothing typed (A, D1)
 *   3. a confused client         a confused message records nothing (D13)
 *   4. nothing but a vague line  the flow still finishes with no document
 *   5. an off-topic question     an aside does not become a field value
 *
 * WHAT THIS FOUND, and the prompt change that came out of it, is written up in
 * `notes/build-tasks.md` under "Wave 6 as built". The headline is run 1: the
 * plan's own open question was whether extraction picks the right party on a
 * two-party contract, since the document itself cannot say which side the
 * client is on. It gets the client's own sentence alongside the file for
 * exactly that reason, and run 1 is the test of it.
 *
 * Live, so it is opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`. It spends real
 * tokens, roughly one Haiku extraction and a handful of Sonnet turns per run
 * plus one Haiku recap, and needs `ANTHROPIC_API_KEY`.
 */

const LIVE = process.env.INTAKE_LIVE_TESTS === '1';

const CONTRACT_PDF = fileURLToPath(
  new URL('../../public/demo/northwind-acme-msa.pdf', import.meta.url),
);

/**
 * The seeded contract is between two companies, and the document alone cannot
 * say which of them is the client.
 *
 * NORTHWIND LOGISTICS LIMITED is the Supplier, ACME HOLDINGS LTD the Customer.
 * The client's own sentence is what settles it, and run 1 checks the answer.
 */
const CLIENT_PARTY = 'northwind';
const OTHER_PARTY = 'acme';

const MAX_TURNS = 12;

/** Answers the field being asked about, and volunteers nothing else. */
const ANSWERS: Record<string, string> = {
  'matter-type': 'A contract.',
  situation:
    'We signed a warehousing and last-mile distribution agreement and the service levels keep being missed.',
  otherSide: 'Acme Holdings Ltd.',
  outcome: 'A clean exit without paying a penalty.',
  urgency: 'This week.',
};

function newBrief(): Brief {
  return createBrief('contract', fieldsForMatter('contract'));
}

function nextAnswer(brief: Brief): string {
  const missing = missingRequiredKeys(brief)[0];
  return (missing && ANSWERS[missing]) ?? 'That is everything I have.';
}

function valueOf(brief: Brief, key: string): string | null {
  return brief.fields.find((field) => field.key === key)?.value ?? null;
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

  let turn: IntakeTurn | null = null;
  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6)) as {
      type: string;
      turn?: IntakeTurn;
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

type Extraction = {
  brief: Brief;
  verifiedCount: number;
  /**
   * Every field the read landed, whatever its provenance.
   *
   * This used to filter on `source === 'document'` and it was hiding the
   * answer to the question the run was asking. A value written in the model's
   * own words cannot carry a verbatim quote, so it fails verification and
   * arrives as `inferred` rather than `document` -- which is correct, and is
   * the honest half of the provenance rule. Reporting only the verified ones
   * had run 1 printing "extracted: []" over a read that had in fact filled the
   * situation.
   */
  fields: BriefField[];
};

/**
 * Read the seeded contract through the real extraction route.
 *
 * `accompanying` mirrors exactly what the app sends. It is the whole mechanism
 * for telling the parties apart, so a run that omits it is testing a different
 * product.
 */
async function extractContract(
  brief: Brief,
  accompanying?: string,
): Promise<Extraction> {
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
              accompanying ? `The client says: "${accompanying}"` : null,
              `Read this document and fill in what you can. Field keys: ${brief.fields
                .map((field) => field.key)
                .join(', ')}.`,
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ],
        // Sent on its own as well, exactly as the app sends it.
        ...(accompanying ? { clientSays: accompanying } : {}),
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

  const result = (await response.json()) as {
    fields?: unknown[];
    verifiedCount?: number;
  };
  expect(response.ok).toBe(true);
  const next = applyFieldUpdates(brief, result.fields ?? []);
  return {
    brief: next,
    verifiedCount: result.verifiedCount ?? 0,
    fields: next.fields.filter((field) => field.value !== null),
  };
}

type Run = {
  turns: number;
  /** What the model asked about, in order. */
  asked: string[];
  /** Each reply, so a run that wanders can be read rather than guessed at. */
  replies: string[];
  reached: boolean;
  brief: Brief;
};

async function converse(
  startingBrief: Brief,
  opening: string,
  /** Turns to take before the scripted client starts cooperating. */
  preamble: string[] = [],
): Promise<Run> {
  let brief = startingBrief;
  const transcript: { role: string; text: string }[] = [];
  const asked: string[] = [];
  const replies: string[] = [];
  const queue = [opening, ...preamble];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const message = queue.shift() ?? nextAnswer(brief);
    const result = await runTurn(brief, transcript, message);
    brief = applyFieldUpdates(brief, result.fieldUpdates);
    asked.push(result.askingAbout || '(nothing)');
    replies.push(result.reply);

    transcript.push({ role: 'user', text: message });
    transcript.push({ role: 'assistant', text: result.reply });

    if (queue.length === 0 && result.nothingRequiredMissing) {
      return { turns: turn, asked, replies, reached: true, brief };
    }

    if (queue.length === 0 && ANSWERS[result.askingAbout]) {
      queue.push(ANSWERS[result.askingAbout]!);
    }
  }

  return { turns: MAX_TURNS, asked, replies, reached: false, brief };
}

/** The header the firm reads first, through the real route. */
async function recap(brief: Brief): Promise<{
  title: string;
  description: string;
}> {
  const response = await recapPOST(
    new Request('http://test/api/recap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief }),
    }),
  );
  expect(response.ok).toBe(true);
  return (await response.json()) as { title: string; description: string };
}

/**
 * The invariants every run has to hold, whatever the model said.
 *
 * These are the five things the plan says must never be cut, expressed as
 * checks: values rather than ticks, nothing from a document treated as
 * certain, the confirm gate, and progress computed from the brief.
 */
function expectInvariants(brief: Brief) {
  for (const field of brief.fields) {
    if (field.value === null) continue;

    // D5, invariant 1. Nothing the model worked out is ever pre-agreed. Only
    // the client's own words auto-approve, and then only because they are the
    // client's own words.
    if (field.source !== 'client') {
      expect(
        field.confirmed,
        `${field.key} came from ${field.source} and must not arrive confirmed`,
      ).toBe(false);
    }

    // Provenance is verified, never asserted: an unmatched quote is dropped
    // along with the source label, so a quote on screen was found in the text.
    if (field.sourceQuote !== null) {
      expect(
        field.source,
        `${field.key} shows a quote, so it must be sourced to a document`,
      ).toBe('document');
    }
  }

  // The confirm gate. A brief with every value in it but nothing agreed to is
  // reviewable and not sendable, and that is the whole point of the gate.
  if (missingRequiredKeys(brief).length === 0) {
    expect(canEnterReview(brief)).toBe(true);
  }
}

describe.runIf(LIVE)('T36, five end-to-end runs', () => {
  it(
    'run 1: a contract and a sentence, the demo path',
    async () => {
      const opening =
        'We signed an MSA with Acme and we want to get out of it early.';
      const read = await extractContract(newBrief(), opening);
      const run = await converse(read.brief, opening);
      const header = await recap(run.brief);

      console.log(
        [
          'RUN 1 contract + sentence',
          `  extracted:  ${JSON.stringify(
            read.fields.map((f) => [f.key, f.source, f.value]),
          )}`,
          `  verified:   ${read.verifiedCount} of ${read.fields.length}`,
          `  asked:      ${JSON.stringify(run.asked)}`,
          `  turns:      ${run.turns}`,
          `  otherSide:  ${JSON.stringify(valueOf(run.brief, 'otherSide'))}`,
          `  title:      ${JSON.stringify(header.title)}`,
        ].join('\n'),
      );

      expect(run.reached).toBe(true);
      expect(missingRequiredKeys(run.brief)).toEqual([]);
      expectInvariants(run.brief);

      /*
       * The party bug, which is the one thing this run exists for.
       *
       * The document names two companies and cannot say which is the client.
       * Naming the client's own company as their opponent is the worst
       * available failure here: it reaches a lawyer as a fact about the matter,
       * and the client has to spot it on a panel of nine rows to stop it.
       */
      const otherSide = (valueOf(run.brief, 'otherSide') ?? '').toLowerCase();
      expect(otherSide).toContain(OTHER_PARTY);
      expect(otherSide).not.toContain(CLIENT_PARTY);

      /*
       * And it has to be a party NAME, not the recital that names the party.
       *
       * The first live run of this test came back with the whole of clause
       * (2): "ACME HOLDINGS LTD, a company incorporated in England and Wales
       * with company number 07731298, whose registered office is at 1
       * Cheapside, London EC2V 6DN". Every word of that is true and verified,
       * and it is still wrong: the brief reads as a document, a row of it is
       * one line, and a 150 character value turns the panel into the contract
       * it was meant to summarise. The long version has a home already, in
       * `sourceQuote` under the value.
       */
      expect(otherSide.length).toBeLessThanOrEqual(60);
      expect(otherSide).not.toContain('incorporated');
      expect(otherSide).not.toContain('registered office');

      // The recap names the case rather than repeating the client (D14).
      expect(header.title.length).toBeGreaterThan(0);
      expect(header.title.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(header.title).not.toContain('?');
      expect(header.title.toLowerCase()).not.toContain('i ');
    },
    10 * 60 * 1000,
  );

  it(
    'run 2: a contract dropped with nothing typed',
    async () => {
      /*
       * A, D1. The opening move is one action and the words are optional: a
       * client who drops the agreement and presses send has taken a real turn.
       * The route rejects an empty message, so the app describes the event
       * instead of inventing a sentence for them, and this run is the check
       * that what it describes does not come back as something they said.
       */
      const read = await extractContract(newBrief());
      const opening = documentsOnlyMessage(['northwind-acme-msa.pdf']);
      const run = await converse(read.brief, opening);

      console.log(
        [
          'RUN 2 contract, no words',
          `  sent as:    ${JSON.stringify(opening)}`,
          `  extracted:  ${JSON.stringify(
            read.fields.map((f) => [f.key, f.source, f.value]),
          )}`,
          `  asked:      ${JSON.stringify(run.asked)}`,
          `  turns:      ${run.turns}`,
          `  first reply: ${JSON.stringify(run.replies[0])}`,
        ].join('\n'),
      );

      expect(run.reached).toBe(true);
      expect(missingRequiredKeys(run.brief)).toEqual([]);
      expectInvariants(run.brief);

      // The bracketed note about what happened must not be filed as prose the
      // client wrote. It is the only synthetic message in the whole flow.
      for (const field of run.brief.fields) {
        expect(field.value ?? '').not.toContain('[');
      }

      /*
       * THE FINDING THIS RUN EXISTS FOR, and it was a live one.
       *
       * On the first pass the read came back with `otherSide` set to
       * "Northwind Logistics Limited", which is the CLIENT's own company, and
       * Moritz then said it out loud: "I've read it through and set this up as
       * a contract matter, with Northwind Logistics as the other side". The
       * document names both parties identically and nobody had said which side
       * the client was on, so the reader picked the first one.
       *
       * Run 1 gets it right because the client's sentence travels with the
       * file. This run is the same document with that sentence removed, which
       * is a real path: a client can drop a contract and press send without
       * typing (A, D1). The prompt's tie-break rule existed but was a sentence
       * in the middle of a paragraph; it is now a named rule with the test
       * spelled out and the failure named. See `EXTRACTION_SYSTEM_PROMPT`.
       *
       * The assertion is deliberately the weak half of the rule. What must
       * never happen is the client's own company appearing as their opponent.
       * Whether the field is left empty (what the prompt now asks for) or
       * filled correctly from something later in the conversation is both
       * acceptable; naming the client is not.
       */
      const otherSide = (valueOf(read.brief, 'otherSide') ?? '').toLowerCase();
      expect(
        otherSide,
        'a read with no client sentence must not name the client as the other side',
      ).not.toContain(CLIENT_PARTY);
    },
    10 * 60 * 1000,
  );

  it(
    'run 3: a client who does not understand the question',
    async () => {
      /*
       * D13, and the single strongest piece of evidence in the whole
       * submission that the product was actually used: in the flow this
       * replaces, "I don't understand what you mean" became the value of a
       * field and then the name of the case.
       *
       * Three confused messages in a row, not one, because the interesting
       * failure is a model that holds the line once and then gives up.
       */
      const confused = [
        "I don't understand what you mean.",
        'Sorry, what?',
        'I still do not follow.',
      ];
      let brief = newBrief();
      const transcript: { role: string; text: string }[] = [];
      const recorded: string[][] = [];

      for (const message of confused) {
        const result = await runTurn(brief, transcript, message);
        recorded.push(result.fieldUpdates.map((update) => update.key));
        brief = applyFieldUpdates(brief, result.fieldUpdates);
        transcript.push({ role: 'user', text: message });
        transcript.push({ role: 'assistant', text: result.reply });
      }

      console.log(
        [
          'RUN 3 confused client',
          `  updates per turn: ${JSON.stringify(recorded)}`,
          `  brief after:      ${JSON.stringify(
            brief.fields.filter((f) => f.value !== null).map((f) => f.key),
          )}`,
        ].join('\n'),
      );

      // Nothing advances, and nothing is recorded. Not "the right thing is
      // recorded": nothing.
      expect(recorded.flat()).toEqual([]);
      expect(canEnterReview(brief)).toBe(false);

      // And the flow is not stuck: a real answer after three confused turns
      // still lands.
      const rescued = await converse(brief, 'A contract with Acme Holdings.');
      expect(rescued.reached).toBe(true);
      expectInvariants(rescued.brief);
    },
    10 * 60 * 1000,
  );

  it(
    'run 4: nothing but a vague opening line',
    async () => {
      // No document, nothing usable in the first message. The path the old
      // scripted flow put everybody down, and the one where the model has to
      // sequence the checklist itself.
      const run = await converse(newBrief(), 'I need some legal help.');
      const header = await recap(run.brief);

      console.log(
        [
          'RUN 4 vague opening, no document',
          `  asked:  ${JSON.stringify(run.asked)}`,
          `  turns:  ${run.turns}`,
          `  title:  ${JSON.stringify(header.title)}`,
        ].join('\n'),
      );

      expect(run.reached).toBe(true);
      expect(missingRequiredKeys(run.brief)).toEqual([]);
      expectInvariants(run.brief);

      /*
       * WHAT THIS RUN CORRECTED, which was an assumption of mine rather than a
       * defect in the flow.
       *
       * This assertion first read `expect(canSend(run.brief)).toBe(true)`, on
       * the reasoning that a brief with no document in it is all the client's
       * own words, so every field auto-approves and the gate costs nobody a
       * tap. It came back false, and the flow is right: the model does not
       * transcribe, it writes the field. Asked what he wants, the client says
       * "a clean exit without paying a penalty" and the value recorded is "A
       * clean exit from the agreement without paying a penalty" -- the model's
       * sentence about what the client said, which is `inferred` and has to be
       * agreed with.
       *
       * That is the confirm gate doing exactly the job it was built for, on
       * the path where it is least expected. So the check is the gate's shape
       * rather than a particular answer: a brief can always be reviewed once it
       * is full, and whether it can be sent is the client's to decide.
       */
      expect(canEnterReview(run.brief)).toBe(true);
      if (!canSend(run.brief)) {
        console.log(
          `  gate:   ${JSON.stringify(
            run.brief.fields
              .filter((f) => f.value !== null && !f.confirmed)
              .map((f) => [f.key, f.source]),
          )} still to agree with`,
        );
      }

      // No field is asked about twice. A model re-asking a field it already
      // has is the specific regression D6 exists to prevent, and it shows up
      // here rather than in the document arm, where extraction hides it.
      //
      // Only checked on this run. Run 5 legitimately asks twice: the client
      // answers an off-topic question with another off-topic question, nothing
      // advances, and asking again is the correct behaviour.
      const answered = run.asked.filter((key) => key !== '(nothing)');
      expect(new Set(answered).size).toBe(answered.length);
    },
    10 * 60 * 1000,
  );

  it(
    'run 5: an off-topic question in the middle of the intake',
    async () => {
      /*
       * An aside is answered, not filed. Clients ask what this costs and
       * whether a real lawyer sees it, and the old flow recorded the question
       * as the answer to whatever it had asked last.
       */
      const run = await converse(
        newBrief(),
        'Before I start, how much is this going to cost me?',
        ['Is a real lawyer actually going to read this?'],
      );

      console.log(
        [
          'RUN 5 off-topic questions first',
          `  asked:   ${JSON.stringify(run.asked)}`,
          `  turns:   ${run.turns}`,
          `  replies: ${JSON.stringify(run.replies.slice(0, 2))}`,
          `  brief:   ${JSON.stringify(
            run.brief.fields
              .filter((f) => f.value !== null)
              .map((f) => [f.key, f.value]),
          )}`,
        ].join('\n'),
      );

      expect(run.reached).toBe(true);
      expectInvariants(run.brief);

      // The questions themselves are never values. Checked by substring
      // because a paraphrase would be just as wrong as a copy.
      for (const field of run.brief.fields) {
        const value = (field.value ?? '').toLowerCase();
        expect(value).not.toContain('how much');
        expect(value).not.toContain('going to cost');
        expect(value).not.toContain('real lawyer');
      }
    },
    10 * 60 * 1000,
  );
});
