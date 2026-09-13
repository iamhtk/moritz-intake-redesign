import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import {
  getMockUser,
  getCurrentRole,
} from '@/components/playground/auth-stubs';
import {
  ASK_GENERAL_SYSTEM_PROMPT,
  askSystemPrompt,
  buildAskContext,
} from '@/lib/ask/context';
import { isAskAvailableFor } from '@/lib/ask/availability';
import { buildAskScope } from '@/lib/ask/scope';
import type { FailureKind } from '@/lib/intake/failure';
import {
  failureKind,
  stopReasonFailure,
  missingKeyResponse,
} from '@/lib/intake/failure-server';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { EXTRACTION_MODEL } from '@/lib/intake/models';
import { stripDashes } from '@/lib/intake/text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One question to Nora.
 *
 * Written from scratch against `anthropic.messages.stream`, following
 * `app/api/intake/route.ts`, and **not** adapted from the Moritz-admin source.
 * That route is Gemini and sets `temperature: 0.3`, which returns a 400 on our
 * models (⚠️ A), and its `startChat({ history })` has no Anthropic equivalent —
 * history goes in `messages`, the instructions go in `system`. A literal port
 * would have failed on the first request.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The scoping happens HERE, server-side, and nowhere else.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The role comes off the cookie via `getCurrentRole()` and the context is built
 * from `buildAskScope()` before the model is called. The client sends a
 * question and a history; it does **not** send a role, a user or a case list,
 * because anything the client sends is something the client can change. A
 * `role: 'INTERNAL_ADMIN'` in a request body would be a privilege escalation
 * with a `curl` one-liner, so the body is never asked what it is allowed to see.
 */

/** Tone and short-term context only. The grounding block is the real memory. */
const HISTORY_WINDOW = 6;

/**
 * Three sentences over a context that fits in one prompt. Generous enough that
 * a list of nine cases is not cut off, and P3 requires it be set explicitly.
 */
const MAX_TOKENS = 1024;

type AskMode = 'cases' | 'general';

type HistoryTurn = { role: 'user' | 'assistant'; text: string };

type AskRequest = {
  mode: AskMode;
  history: HistoryTurn[];
  message: string;
};

function isHistoryTurn(value: unknown): value is HistoryTurn {
  if (typeof value !== 'object' || value === null) return false;
  const { role, text } = value as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof text === 'string';
}

function parseBody(value: unknown): AskRequest | null {
  if (typeof value !== 'object' || value === null) return null;
  const { mode, history, message } = value as Record<string, unknown>;

  if (typeof message !== 'string' || message.trim() === '') return null;
  if (mode !== 'cases' && mode !== 'general') return null;

  const turns = Array.isArray(history) ? history.filter(isHistoryTurn) : [];

  return {
    mode,
    // Keep only the tail. An unbounded history would grow the request forever
    // and push the grounding block further from the question it answers.
    history: turns.slice(-HISTORY_WINDOW),
    message,
  };
}

function sse(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

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
      { error: 'Body must include a mode, a history array and a message' },
      { status: 400 },
    );
  }

  /*
   * Resolved from the cookie, never from the body. This is the boundary.
   */
  const role = await getCurrentRole();
  const user = await getMockUser();

  /*
   * Ask is a client surface, and this is where that is actually enforced.
   *
   * The panel and the ⌘J trigger are not mounted for the other three roles, so
   * no request from them can originate in the UI. That is not the same as the
   * feature being off for them: the cookie is the only thing standing between
   * a `curl` and an answer, and "the button is not rendered" has never been an
   * access control. Same cookie, same `role`, one predicate, checked before a
   * scope is built or a token is spent.
   *
   * 403 rather than a streamed `error` event, because this is not a failed
   * answer, it is a request that should not have been made. `readAskStream`
   * maps a non-OK status onto a named kind, so the one path that can still
   * reach here from a browser — a tab left open while the playground role was
   * switched in another one — renders copy rather than an empty bubble.
   */
  if (!isAskAvailableFor(role)) {
    return Response.json(
      { error: 'Ask is not available for this role' },
      { status: 403 },
    );
  }

  /*
   * The general mode gets no grounding block at all — not a redacted one, not
   * an empty one. Two isolated histories are §8.6's rule and this is the
   * server half of it: even if a client spliced a grounded transcript into a
   * general request, there is nothing in the prompt for the model to ground
   * against, so it cannot answer as though there were.
   *
   * On the grounded mode the prompt is chosen by the **same role** that built
   * the block, via `askSystemPrompt`. A client gets a client-shaped block and
   * the client prompt; the internal roles get theirs. Deriving both from one
   * `role` local is what keeps them from drifting apart, because a client
   * described by the internal prompt would be told about sections that the
   * block no longer has.
   */
  const grounded = body.mode === 'cases';
  const system = grounded ? askSystemPrompt(role) : ASK_GENERAL_SYSTEM_PROMPT;
  const context = grounded
    ? buildAskContext(buildAskScope(role, user), new Date())
    : null;

  const messages: MessageParam[] = [
    ...body.history.map<MessageParam>((turn) => ({
      role: turn.role,
      content: turn.text,
    })),
    {
      role: 'user',
      content: context
        ? `${context}\n\nQUESTION\n${body.message}`
        : body.message,
    },
  ];

  /*
   * No key, no model. Answered as `unauthorized` before anything is built or
   * spent, rather than letting `new Anthropic()` throw into a 500 that the
   * client reads as "busy, try again". See `missingKeyResponse`.
   */
  const noKey = missingKeyResponse('ask');
  if (noKey) return noKey;

  const anthropic = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      /**
       * End the turn with a named failure, and keep the real reason here (P4).
       *
       * The kind is all the client gets, and it resolves to a sentence in
       * `en.json`. `/api/intake` shipped an SDK sentence about `apiKey` to a
       * client once; the comment in `lib/intake/stream-client.ts` records it.
       * This is the same discipline, reusing the same seven kinds and adding
       * none.
       */
      const fail = (kind: FailureKind, detail?: string) => {
        console.error(`[ask] ${kind}${detail ? `: ${detail}` : ''}`);
        send({ type: 'error', kind });
        controller.close();
      };

      try {
        /*
         * No `temperature`, no `top_p`, no `top_k` (P3) — any non-default value
         * is a 400 on these models, which is the trap the source route walks
         * straight into. `max_tokens` is explicit, as the rule file requires.
         * No `cache_control`: see the note on `ASK_SYSTEM_PROMPT`.
         */
        const modelStream = anthropic.messages.stream({
          model: EXTRACTION_MODEL,
          max_tokens: MAX_TOKENS,
          system,
          messages,
        });

        modelStream.on('text', (delta) => send({ type: 'delta', text: delta }));

        const message = await modelStream.finalMessage();
        logAnthropicUsage('ask', message.usage);

        /*
         * How it stopped, before anything it said is read. Both kinds this
         * catches arrive as a successful response, so nothing throws and a
         * route that only wrapped its call in a `try` would go on to report a
         * refusal as an empty answer.
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

        const answer = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
          .trim();

        if (answer === '') {
          // A clean stop with nothing in it is not a quiet state — the quiet
          // state is a sentence. An empty bubble is a bug, and naming it
          // `unreadable` gets the reader a retry rather than silence.
          fail('unreadable', 'empty answer with a clean stop_reason');
          return;
        }

        // The prompt forbids dashes as punctuation; this guarantees it, exactly
        // as the intake route does.
        send({ type: 'done', answer: stripDashes(answer) });
      } catch (error) {
        console.error(
          `[ask] ${failureKind(error)}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        send({ type: 'error', kind: failureKind(error) });
      } finally {
        /*
         * `fail` has already closed on every path that used it, so the guard
         * keeps a double close from throwing `Invalid state` over the top of
         * the real failure and turning a named error into a dropped stream.
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
