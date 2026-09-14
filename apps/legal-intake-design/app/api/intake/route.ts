import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { Brief } from '@/lib/intake/brief';
import { repairTurn } from '@/lib/intake/dead-end';
import type { FailureKind } from '@/lib/intake/failure';
import { failureKind, stopReasonFailure } from '@/lib/intake/failure-server';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { CONVERSATION_MODEL } from '@/lib/intake/models';
import { offlineTurn } from '@/lib/intake/offline-turn';
import { TRANSCRIPT_WINDOW } from '@/lib/intake/outgoing-turn';
import { INTAKE_SYSTEM_PROMPT } from '@/lib/intake/system-prompt';
import { stripDashes } from '@/lib/intake/text';
import {
  INTAKE_TURN_SCHEMA,
  type IntakeTurn,
  parseIntakeTurn,
  parseWaitingTurn,
  renderBriefState,
  renderSentBrief,
  WAITING_TURN_SCHEMA,
} from '@/lib/intake/turn-schema';
import { WAITING_SYSTEM_PROMPT } from '@/lib/intake/waiting-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TranscriptTurn = { role: 'user' | 'assistant'; text: string };

/**
 * Which conversation this is: the intake, or the wait after it.
 *
 * One route and two modes rather than a second route, because everything either
 * mode needs from this file is the part that is not the prompt: the SSE framing,
 * the stop-reason check before any content is read, the named failure kinds, the
 * dash strip, and the usage log. A `/api/waiting` route would be a copy of two
 * hundred lines of that in order to vary three of them, and the copy is where
 * the two would drift.
 */
type TurnMode = 'intake' | 'waiting';

type TurnRequest = {
  brief: Brief;
  transcript: TranscriptTurn[];
  message: string;
  mode: TurnMode;
};

/**
 * Everything that differs between the two modes, in one place.
 *
 * Written as a lookup rather than as branches at the three call sites, so
 * adding a mode cannot mean adding a prompt and forgetting the parser. The
 * pairing is the part that matters: a schema without its own parser would
 * validate a shape nothing knows how to read, and `parseIntakeTurn` against a
 * one-property response returns a turn with four values the model never sent.
 */
const MODES: Readonly<
  Record<
    TurnMode,
    {
      prompt: string;
      /*
       * `Record<string, unknown>`, not `object`, because that is what
       * `output_config.format` takes. The two schemas are `as const` literals
       * and satisfy either, but `object` carries no index signature, so the
       * assignment at the call site failed on a shape that was always correct.
       */
      schema: Record<string, unknown>;
      parse: (value: unknown) => ReturnType<typeof parseIntakeTurn>;
      renderBrief: (brief: Brief) => string;
      /**
       * The turn, made to hold its own contract before anybody reads it.
       *
       * In the lookup rather than as an `if (mode === 'intake')` at the call
       * site, because the reason the two modes differ here is not incidental:
       * `repairTurn` exists to keep a gap-filling conversation moving, and the
       * waiting conversation has no gaps, no brief it may change, and nothing
       * to ask about. Appending a question to a concierge reply would be the
       * sealed case being interviewed again, which is the exact failure
       * `WAITING_TURN_SCHEMA` was carved out to prevent.
       */
      repair: (
        turn: IntakeTurn,
        brief: Brief,
      ) => { turn: IntakeTurn; changed: string | null };
    }
  >
> = {
  intake: {
    prompt: INTAKE_SYSTEM_PROMPT,
    schema: INTAKE_TURN_SCHEMA,
    parse: parseIntakeTurn,
    renderBrief: renderBriefState,
    repair: repairTurn,
  },
  waiting: {
    prompt: WAITING_SYSTEM_PROMPT,
    schema: WAITING_TURN_SCHEMA,
    parse: parseWaitingTurn,
    renderBrief: renderSentBrief,
    repair: (turn) => ({ turn, changed: null }),
  },
};

function isTurnMode(value: unknown): value is TurnMode {
  return value === 'intake' || value === 'waiting';
}

function isTranscriptTurn(value: unknown): value is TranscriptTurn {
  if (typeof value !== 'object' || value === null) return false;
  const { role, text } = value as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof text === 'string';
}

function isBrief(value: unknown): value is Brief {
  if (typeof value !== 'object' || value === null) return false;
  const { matterId, fields } = value as Record<string, unknown>;
  return typeof matterId === 'string' && Array.isArray(fields);
}

function parseBody(value: unknown): TurnRequest | null {
  if (typeof value !== 'object' || value === null) return null;
  const { brief, transcript, message, mode } = value as Record<string, unknown>;

  if (!isBrief(brief)) return null;
  if (typeof message !== 'string' || message.trim() === '') return null;

  const turns = Array.isArray(transcript)
    ? transcript.filter(isTranscriptTurn)
    : [];

  return {
    brief,
    // Keep only the tail: an unbounded transcript would grow the request
    // forever and push the cached prefix further from the useful context.
    transcript: turns.slice(-TRANSCRIPT_WINDOW),
    message,
    /*
     * Absent means `intake`, and that default is the safe one rather than the
     * convenient one: a body that forgot to say which mode it wanted gets the
     * interviewer, which over-collects, rather than the concierge, which would
     * answer an intake question by telling the client their case had been sent.
     */
    mode: isTurnMode(mode) ? mode : 'intake',
  };
}

/**
 * The brief and the new message ride in the final user turn, after the cached
 * system prefix, so the cache stays valid for the whole session.
 */
function buildMessages(body: TurnRequest): MessageParam[] {
  const history: MessageParam[] = body.transcript.map((turn) => ({
    role: turn.role,
    content: turn.text,
  }));

  return [
    ...history,
    {
      role: 'user',
      content: `${MODES[body.mode].renderBrief(body.brief)}\n\nCLIENT MESSAGE\n${body.message}`,
    },
  ];
}

function sse(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * How hard the model thinks before it answers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS WAS `low`, AND `low` IS WHERE THE WEIRDNESS CAME FROM.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `low` is the right setting for a chat turn, and this is not a chat turn. One
 * call has to do all of the following against a four-hundred-line prompt: read
 * the whole brief, work out which rows are closed to it, decide what one thing
 * to ask, write the question, decide whether that question has a small set of
 * honest answers and name them, pull values out of the client's sentence,
 * decide for each whether it is repeating the client or reading between the
 * lines, and calibrate a confidence number that the client will read against
 * every other number in the panel.
 *
 * At `low` the rules get skipped roughly in the order they appear, and the
 * symptoms were exactly the ones you would predict from that: a turn that
 * acknowledged a value and forgot to ask the next question, an `askingAbout`
 * naming a row the reply never mentioned, and a name the model had quietly
 * expanded ("Cross river" to "Cross River Bank") filed as the client's own
 * words at full confidence. None of those is a hard failure. All of them make
 * the product look like it is not paying attention, which on an intake is the
 * one thing it cannot afford to look like.
 *
 * `high` is the API's own default and the documented floor for
 * intelligence-sensitive work. Not `xhigh` or `max`: the client is watching a
 * spinner while this runs, the reply cannot begin streaming until the thinking
 * is done, and the top of the range earns its latency on long-horizon agentic
 * work rather than on one well-specified turn. One constant, so a reviewer who
 * wants to trade seconds for judgement has one line to change.
 */
const TURN_EFFORT = 'high' as const;

/**
 * The output ceiling for one turn, thinking included.
 *
 * Raised from 4096, and it had to be: adaptive thinking is billed and counted
 * inside `max_tokens`, so the old ceiling would have been spent on reasoning
 * and cut the JSON off mid-object. That failure arrives as a successful
 * response with `stop_reason: 'max_tokens'`, which this route names
 * `truncated`, and `truncated` is deliberately not retryable, so the client
 * would have been left with a sentence and no button. Generous rather than
 * tuned, because the turn itself is a few hundred tokens and nothing here is
 * billed for headroom that goes unused.
 */
const MAX_TURN_TOKENS = 16000;

/** How long the scripted path waits between chunks, in milliseconds. */
const SCRIPTED_CHUNK_MS = 28;

/**
 * The scripted reply, broken where a reader would pause.
 *
 * Split on word boundaries rather than into fixed slices so no chunk ever
 * cuts a word in half. The client concatenates deltas, so the result is
 * identical either way once the turn is done; this is only about what the
 * half-finished sentence looks like while it arrives, which is the whole
 * reason the model path streams at all.
 */
function scriptedChunks(reply: string): string[] {
  return reply.match(/\S+\s*/g) ?? [reply];
}

function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SCRIPTED_CHUNK_MS));
}

/**
 * One conversational turn.
 *
 * Streams the model's raw text as it arrives so the client can show the reply
 * while it is still being written, then sends one final `done` event carrying
 * the parsed and validated turn. The client renders from the stream but only
 * ever applies field updates from `done`, partial JSON is for reading, not for
 * changing the brief.
 */
export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const body = parseBody(json);
  if (!body) {
    return Response.json(
      { error: 'Body must include a brief, a transcript array and a message' },
      { status: 400 },
    );
  }

  /*
   * No key, no model — but still an intake (item 11).
   *
   * This used to answer `unauthorized` here and stop, which meant a reviewer
   * who had not set a key could not describe a matter at all. It now falls
   * through to the scripted interviewer below, over the same SSE framing, so
   * the flow is walkable with nothing configured. `/api/extract` still
   * declines without a key, and correctly: reading a PDF is not something a
   * keyword table can fake, and pretending otherwise would put invented
   * provenance on a client's document.
   */
  const keyless = !process.env.ANTHROPIC_API_KEY;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      /**
       * End the turn with a named failure, and keep the real reason here.
       *
       * The kind is all the client gets; it resolves to a sentence in
       * `en.json`. The log line is the half a developer needs, and is the only
       * place a provider string is allowed to appear.
       */
      const fail = (kind: FailureKind, detail?: string) => {
        console.error(`[intake] ${kind}${detail ? `: ${detail}` : ''}`);
        send({ type: 'error', kind });
        controller.close();
      };

      /**
       * End the turn with the parsed result, whoever produced it.
       *
       * Shared by the model path and the scripted one so the dash strip cannot
       * apply to only one of them. It matters more for the scripted path than
       * it looks: the authored prompts in `matters/*.ts` are full of em dashes,
       * so the offline interviewer is in fact the bigger source of them.
       */
      const done = (turn: IntakeTurn) => {
        send({
          type: 'done',
          turn: {
            ...turn,
            reply: stripDashes(turn.reply),
            fieldUpdates: turn.fieldUpdates.map((update) => ({
              ...update,
              value: stripDashes(update.value),
            })),
          },
        });
      };

      const mode = MODES[body.mode];

      /*
       * The scripted path. Streamed a clause at a time rather than sent whole,
       * because the client renders from the delta stream and a single delta
       * would arrive as a finished paragraph with no typing at all — the one
       * visible difference between the two paths, and an unnecessary one.
       */
      if (keyless) {
        const turn = offlineTurn({
          brief: body.brief,
          message: body.message,
          mode: body.mode,
        });
        for (const chunk of scriptedChunks(stripDashes(turn.reply))) {
          send({ type: 'delta', text: chunk });
          await pause();
        }
        done(turn);
        controller.close();
        return;
      }

      try {
        const modelStream = new Anthropic().messages.stream({
          model: CONVERSATION_MODEL,
          max_tokens: MAX_TURN_TOKENS,
          /*
           * Adaptive thinking, which on this model is the only on-mode and is
           * not on by default. `effort` alone would have changed how much the
           * model was willing to spend without giving it anywhere to spend it.
           *
           * `display` is left at its default, so the thinking blocks arrive
           * empty and nothing reasons about them. The route streams `text`
           * only, and the client already names this wait on the journey rail
           * ("Checking that against the rest of your case"), which is a better
           * account of the pause than a summary of the model's own reasoning
           * would be.
           */
          thinking: { type: 'adaptive' },
          system: [
            {
              type: 'text',
              text: mode.prompt,
              /*
               * Both prompts carry the breakpoint, and both are the same kind
               * of block: one large string, byte-identical on every turn of
               * every session, with everything per-turn pushed into the user
               * message. The waiting prompt is the shorter of the two and may
               * sit under the model's minimum cacheable prefix, in which case
               * the API simply does not cache it rather than erroring. That is
               * the right trade either way, because the alternative is a mode
               * that silently pays full price on the turn after a client has
               * asked two questions in a row.
               */
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: buildMessages(body),
          output_config: {
            effort: TURN_EFFORT,
            format: { type: 'json_schema', schema: mode.schema },
          },
        });

        modelStream.on('text', (delta) => send({ type: 'delta', text: delta }));

        const message = await modelStream.finalMessage();
        /*
         * Logged under the mode, not under one label for both. The two modes
         * have different prompt sizes and different cache behaviour, and a
         * single `intake` line in the usage log would average them into a
         * number that describes neither.
         */
        logAnthropicUsage(body.mode, message.usage);

        /*
         * How it stopped, before anything it said is read.
         *
         * Both of the kinds this catches arrive as a successful response, so
         * nothing throws and the code below would go on to `JSON.parse` either
         * a refusal sentence or half an object and report unreadable JSON — a
         * true statement about the wrong problem, and one the client can do
         * nothing with. A refusal is checked first because that is the API's
         * own rule for it: do not read `content` until `stop_reason` is known.
         */
        const stopped = stopReasonFailure(message);
        if (stopped) {
          fail(
            stopped,
            stopped === 'refused'
              ? `stop_details: ${JSON.stringify(message.stop_details)}`
              : `output_tokens: ${message.usage.output_tokens}`,
          );
          return;
        }

        const raw = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw) as unknown;
        } catch {
          fail('unreadable', `not JSON: ${raw.slice(0, 200)}`);
          return;
        }

        const parsedTurn = mode.parse(parsed);
        if (!parsedTurn) {
          fail('unreadable', 'JSON did not match the turn schema');
          return;
        }

        /*
         * The turn, held to the contract it is supposed to keep: an
         * `askingAbout` that names an empty row or nothing, a
         * `nothingRequiredMissing` that agrees with the brief, and a reply that
         * asks something whenever the client still has something they must
         * answer. See `dead-end.ts` for why this is enforced here rather than
         * asked for in the prompt alone.
         *
         * Logged when it fires, because a repair is a prompt regression that
         * has been papered over: nothing fails, the client is fine, and the
         * only trace is this line. A log full of them means the prompt rule has
         * stopped working and wants looking at.
         */
        const { turn, changed } = mode.repair(parsedTurn, body.brief);
        if (changed) {
          console.warn(`[intake] repaired turn (${body.mode}): ${changed}`);
        }

        done(turn);
      } catch (error) {
        console.error(
          `[intake] ${failureKind(error)}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        send({ type: 'error', kind: failureKind(error) });
      } finally {
        /*
         * Closing twice is a no-op in practice but `fail` has already closed
         * on every path that used it, so the guard keeps this from throwing
         * `TypeError: Invalid state` over the top of the real failure and
         * turning a named error into a dropped stream.
         */
        try {
          controller.close();
        } catch {
          // Already closed by `fail`.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
