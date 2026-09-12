import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { CONVERSATION_MODEL } from '@/lib/intake/models';
import { INTAKE_SYSTEM_PROMPT } from '@/lib/intake/system-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IntakeRequestBody = {
  messages: MessageParam[];
};

function isMessageParam(value: unknown): value is MessageParam {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  return (
    (role === 'user' || role === 'assistant') &&
    (typeof content === 'string' || Array.isArray(content))
  );
}

function parseBody(value: unknown): IntakeRequestBody | null {
  if (typeof value !== 'object' || value === null) return null;
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (!messages.every(isMessageParam)) return null;
  return { messages };
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
      { error: 'Body must include a non-empty messages array' },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic();

  const stream = anthropic.messages.stream({
    model: CONVERSATION_MODEL,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: INTAKE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: body.messages,
  });

  stream.on('message', (message) => {
    logAnthropicUsage('intake', message.usage);
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
