import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlockParam,
  DocumentBlockParam,
  Message,
  MessageParam,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages';
import {
  INTAKE_EXTRACTION_SCHEMA,
  type IntakeExtraction,
  type IntakeFieldStatus,
} from '@/lib/intake/schema';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { EXTRACTION_MODEL } from '@/lib/intake/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXTRACTION_SYSTEM_PROMPT =
  'You extract structured legal-intake fields from the conversation and any attached PDF documents. Fill matterType and fields according to the schema. Use status "found" when a value is present, "missing" when absent, and "unclear" when ambiguous.';

type ExtractRequestBody = {
  messages: MessageParam[];
  /** Optional base64-encoded PDF documents (raw base64, no data-URL prefix). */
  documents?: string[];
};

const FIELD_STATUSES: ReadonlySet<string> = new Set([
  'found',
  'missing',
  'unclear',
]);

function isMessageParam(value: unknown): value is MessageParam {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  return (
    (role === 'user' || role === 'assistant') &&
    (typeof content === 'string' || Array.isArray(content))
  );
}

function parseDocuments(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  if (!value.every((item) => typeof item === 'string' && item.length > 0)) {
    return undefined;
  }
  return value;
}

function parseBody(value: unknown): ExtractRequestBody | null {
  if (typeof value !== 'object' || value === null) return null;
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (!messages.every(isMessageParam)) return null;

  const rawDocs = (value as { documents?: unknown }).documents;
  if (rawDocs !== undefined) {
    const documents = parseDocuments(rawDocs);
    if (!documents) return null;
    return { messages, documents };
  }

  return { messages };
}

function toDocumentBlock(base64Pdf: string): DocumentBlockParam {
  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: base64Pdf,
    },
  };
}

function withDocuments(
  messages: MessageParam[],
  documents: string[] | undefined,
): MessageParam[] {
  if (!documents || documents.length === 0) return messages;

  const docBlocks: DocumentBlockParam[] = documents.map(toDocumentBlock);
  const cloned = messages.map((message) => ({ ...message }));
  const lastIndex = cloned.length - 1;
  const last = cloned[lastIndex];
  if (!last || last.role !== 'user') {
    cloned.push({
      role: 'user',
      content: [...docBlocks, { type: 'text', text: 'Extract intake fields.' }],
    });
    return cloned;
  }

  const existing: ContentBlockParam[] =
    typeof last.content === 'string'
      ? [{ type: 'text', text: last.content }]
      : [...last.content];

  cloned[lastIndex] = {
    role: 'user',
    content: [...docBlocks, ...existing],
  };
  return cloned;
}

function isIntakeFieldStatus(value: unknown): value is IntakeFieldStatus {
  return typeof value === 'string' && FIELD_STATUSES.has(value);
}

function parseIntakeExtraction(value: unknown): IntakeExtraction | null {
  if (typeof value !== 'object' || value === null) return null;
  const matterType = (value as { matterType?: unknown }).matterType;
  const fields = (value as { fields?: unknown }).fields;
  if (typeof matterType !== 'string' || !Array.isArray(fields)) return null;

  const parsedFields: IntakeExtraction['fields'] = [];
  for (const field of fields) {
    if (typeof field !== 'object' || field === null) return null;
    const key = (field as { key?: unknown }).key;
    const fieldValue = (field as { value?: unknown }).value;
    const source = (field as { source?: unknown }).source;
    const status = (field as { status?: unknown }).status;
    if (
      typeof key !== 'string' ||
      typeof fieldValue !== 'string' ||
      typeof source !== 'string' ||
      !isIntakeFieldStatus(status)
    ) {
      return null;
    }
    parsedFields.push({ key, value: fieldValue, source, status });
  }

  return { matterType, fields: parsedFields };
}

function textFromMessage(content: Message['content']): string {
  return content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
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
      {
        error:
          'Body must include a non-empty messages array and an optional documents string array',
      },
      { status: 400 },
    );
  }

  try {
    const anthropic = new Anthropic();
    const messages = withDocuments(body.messages, body.documents);

    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: EXTRACTION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
      output_config: {
        format: {
          type: 'json_schema',
          schema: INTAKE_EXTRACTION_SCHEMA,
        },
      },
    });

    logAnthropicUsage('extract', message.usage);

    const rawText = textFromMessage(message.content);
    if (!rawText) {
      return Response.json(
        { error: 'Model returned no text content' },
        { status: 500 },
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText) as unknown;
    } catch {
      return Response.json(
        { error: `Model returned non-JSON text: ${rawText.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const extraction = parseIntakeExtraction(parsedJson);
    if (!extraction) {
      return Response.json(
        { error: 'Model JSON did not match IntakeExtraction shape' },
        { status: 500 },
      );
    }

    const typed: IntakeExtraction = extraction;
    return Response.json(typed);
  } catch (err) {
    return Response.json({ error: errorMessage(err) }, { status: 500 });
  }
}
