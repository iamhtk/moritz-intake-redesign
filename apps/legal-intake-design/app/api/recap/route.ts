import Anthropic from '@anthropic-ai/sdk';
import {
  documentDisagreements,
  type Brief,
  type BriefField,
} from '@/lib/intake/brief';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { NO_DASH_RULE, stripDashes } from '@/lib/intake/text';
import { EXTRACTION_MODEL } from '@/lib/intake/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Names the case and writes the description a lawyer reads first.
 *
 * The title comes from the matter type and the parties, never from raw chat.
 * In the flow this replaces, a client typing "I don't understand what you mean"
 * had that sentence become the name of their legal case.
 */
const RECAP_SYSTEM_PROMPT = `You write the header of a legal matter file from a completed intake brief.

title
 Short, factual, the way a law firm would name a matter on a folder. Build it
 from the matter type and the parties, for example "Contract review for Acme
 Holdings" or "Employment dispute, J. Whitfield". Never longer than about
 eight words. Never a sentence, never a question, and never copied from
 something the client typed.

description
 Two or three sentences for the lawyer picking this up cold: what the client
 needs, who it involves, and how urgent it is. Plain English, no preamble, no
 greeting, and no advice about the merits.

Where the client's answer differs from the uploaded document, say so plainly in
the description. That disagreement is a fact about the matter, not a mistake to
smooth over.

${NO_DASH_RULE}`;

const RECAP_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['title', 'description'],
  additionalProperties: false,
} as const;

function isBrief(value: unknown): value is Brief {
  if (typeof value !== 'object' || value === null) return false;
  const { matterId, fields } = value as Record<string, unknown>;
  return typeof matterId === 'string' && Array.isArray(fields);
}

function renderForRecap(brief: Brief): string {
  const filled = (brief.fields as BriefField[])
    .filter((field) => field.value !== null)
    .map((field) => `- ${field.label}: ${field.value}`)
    .join('\n');

  const disagreements = documentDisagreements(brief)
    .map(
      (item) =>
        `- ${item.label}: client says "${item.clientValue}", the document says "${item.documentValue}"${
          item.where ? ` (${item.where})` : ''
        }`,
    )
    .join('\n');

  return [
    `MATTER TYPE: ${brief.matterId}`,
    '',
    'BRIEF',
    filled || '(nothing filled in)',
    ...(disagreements
      ? ['', 'WHERE THE CLIENT AND THE DOCUMENT DISAGREE', disagreements]
      : []),
  ].join('\n');
}

export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const brief = (json as { brief?: unknown })?.brief;
  if (!isBrief(brief)) {
    return Response.json(
      { error: 'Body must include a brief' },
      { status: 400 },
    );
  }

  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      system: RECAP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: renderForRecap(brief) }],
      output_config: {
        format: { type: 'json_schema', schema: RECAP_SCHEMA },
      },
    });

    logAnthropicUsage('recap', message.usage);

    const raw = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    const parsed = JSON.parse(raw) as {
      title?: unknown;
      description?: unknown;
    };
    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.description !== 'string'
    ) {
      return Response.json(
        { error: 'Model JSON did not match the recap shape' },
        { status: 500 },
      );
    }

    return Response.json({
      title: stripDashes(parsed.title),
      description: stripDashes(parsed.description),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
