import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { Brief } from '@/lib/intake/brief';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { CONVERSATION_MODEL } from '@/lib/intake/models';
import { INTAKE_SYSTEM_PROMPT } from '@/lib/intake/system-prompt';
import { stripDashes } from '@/lib/intake/text';
import {
  INTAKE_TURN_SCHEMA,
  parseIntakeTurn,
  renderBriefState,
} from '@/lib/intake/turn-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Tone and short-term context only. The brief is the real memory. */
const TRANSCRIPT_WINDOW = 6;

type TranscriptTurn = { role: 'user' | 'assistant'; text: string };

type TurnRequest = {
  brief: Brief;
  transcript: TranscriptTurn[];
  message: string;
};

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
  const { brief, transcript, message } = value as Record<string, unknown>;

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
      content: `${renderBriefState(body.brief)}\n\nCLIENT MESSAGE\n${body.message}`,
    },
  ];
}

function sse(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
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

  const anthropic = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      try {
        const modelStream = anthropic.messages.stream({
          model: CONVERSATION_MODEL,
          max_tokens: 4096,
          system: [
            {
              type: 'text',
              text: INTAKE_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: buildMessages(body),
          output_config: {
            effort: 'low',
            format: { type: 'json_schema', schema: INTAKE_TURN_SCHEMA },
          },
        });

        modelStream.on('text', (delta) => send({ type: 'delta', text: delta }));

        const message = await modelStream.finalMessage();
        logAnthropicUsage('intake', message.usage);

        const raw = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw) as unknown;
        } catch {
          send({
            type: 'error',
            message: 'The model returned unreadable JSON.',
          });
          controller.close();
          return;
        }

        const turn = parseIntakeTurn(parsed);
        if (!turn) {
          send({
            type: 'error',
            message: 'The model reply did not match the turn schema.',
          });
          controller.close();
          return;
        }

        // Belt and braces: the prompt forbids dashes, this guarantees it.
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
      } catch (error) {
        send({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
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
