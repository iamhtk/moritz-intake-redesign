import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlockParam,
  DocumentBlockParam,
  Message,
  MessageParam,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages';
import { extractText, getDocumentProxy } from 'unpdf';
import type { FieldUpdate } from '@/lib/intake/brief';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import { EXTRACTION_MODEL } from '@/lib/intake/models';
import { INTAKE_EXTRACTION_SCHEMA, parseExtraction } from '@/lib/intake/schema';
import { NO_DASH_RULE, stripDashes } from '@/lib/intake/text';
import { verifySourceQuote } from '@/lib/intake/verify-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * No `cache_control` on this route. The extraction prompt is far below Haiku's
 * 4096-token cache floor, and the document payload changes on every call, so
 * there is no reusable prefix to cache. A marker that silently does nothing
 * reads as a working optimization to the next person.
 */
const EXTRACTION_SYSTEM_PROMPT = `You read an uploaded legal document and pull out the facts a law firm needs to
open a matter.

For every field you fill in, you must report:
 sourceNote where in the document you read it, in plain words, for example
 "clause 11.3" or "parties section, page 1". Just the location:
 the file name is added for you.
 sourceQuote the exact words from the document that the value came from,
 copied character for character, as ONE continuous passage.
 Do not stitch two clauses together with "...". If a value rests
 on two separate clauses, quote the single clearest one.

The quote is checked against the real text of the document. If it does not
appear there, the value is marked unverified and its source is hidden from the
client. So quote the document exactly, and never quote from memory, from the
conversation, or from what you expect a contract to say.

Only include a field when the document actually says it. Leave out anything you
would be guessing at: a missing field is fine, an invented one is not.

${NO_DASH_RULE}
The one exception is sourceQuote, which is copied from the document and must
keep the document's own punctuation.`;

type ExtractRequestBody = {
  messages: MessageParam[];
  /** Base64-encoded PDFs, no data-URL prefix. */
  documents?: string[];
  /** Shown to the client as the source, e.g. "vendor-agreement.pdf". */
  documentName?: string;
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

  const rawName = (value as { documentName?: unknown }).documentName;
  const documentName = typeof rawName === 'string' ? rawName : undefined;

  const rawDocs = (value as { documents?: unknown }).documents;
  if (rawDocs !== undefined) {
    const documents = parseDocuments(rawDocs);
    if (!documents) return null;
    return { messages, documents, ...(documentName ? { documentName } : {}) };
  }

  return { messages, ...(documentName ? { documentName } : {}) };
}

function toDocumentBlock(base64Pdf: string): DocumentBlockParam {
  return {
    type: 'document',
    source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf },
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

  cloned[lastIndex] = { role: 'user', content: [...docBlocks, ...existing] };
  return cloned;
}

/**
 * Our own read of the document, independent of the model's.
 *
 * A scan, a photograph or a DOCX has no text layer to return. That is not an
 * error, the model can still read the pages as images, but with nothing to
 * check a quote against, every field it proposes will end up unverified.
 */
async function readDocumentText(
  documents: string[] | undefined,
): Promise<string> {
  if (!documents || documents.length === 0) return '';

  const parts: string[] = [];
  for (const base64 of documents) {
    try {
      const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      if (text.trim() !== '') parts.push(text);
    } catch {
      // Not a readable PDF. Leave it out; verification will simply fail closed.
    }
  }
  return parts.join('\n\n');
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

    // Read the document ourselves and ask the model to read it, in parallel.
    const [documentText, message] = await Promise.all([
      readDocumentText(body.documents),
      anthropic.messages.create({
        model: EXTRACTION_MODEL,
        max_tokens: 2048,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: withDocuments(body.messages, body.documents),
        output_config: {
          format: { type: 'json_schema', schema: INTAKE_EXTRACTION_SCHEMA },
        },
      }),
    ]);

    logAnthropicUsage('extract', message.usage);

    const raw = textFromMessage(message.content);
    if (!raw) {
      return Response.json(
        { error: 'Model returned no text content' },
        { status: 500 },
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw) as unknown;
    } catch {
      return Response.json(
        { error: `Model returned non-JSON text: ${raw.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const extraction = parseExtraction(parsedJson);
    if (!extraction) {
      return Response.json(
        { error: 'Model JSON did not match the extraction shape' },
        { status: 500 },
      );
    }

    // The decision the model does not get to make.
    let verifiedCount = 0;
    const fields: FieldUpdate[] = extraction.fields.map((field) => {
      const verified = verifySourceQuote(field.sourceQuote, documentText);
      if (verified) verifiedCount += 1;

      // "vendor-agreement.pdf, clause 11.3", the client should be able to go
      // and look, which means naming the file as well as the place in it.
      const where = stripDashes(field.sourceNote);
      const sourceNote = body.documentName
        ? [body.documentName, where].filter(Boolean).join(', ')
        : where;

      return {
        key: field.key,
        value: stripDashes(field.value),
        // Everything from a document arrives unconfirmed. Verification decides
        // whether we show a source, never whether the client must confirm.
        source: verified ? 'document' : 'inferred',
        confidence: 'unsure',
        sourceNote: verified ? sourceNote : null,
        // Never cleaned up: this is a verbatim quotation, checked against the
        // real text. Rewriting its punctuation would misquote the document.
        sourceQuote: verified ? field.sourceQuote : null,
      };
    });

    return Response.json({
      matterType: extraction.matterType,
      fields,
      /** False for scans, photos and anything else with no text layer. */
      documentTextAvailable: documentText.trim() !== '',
      verifiedCount,
    });
  } catch (err) {
    return Response.json({ error: errorMessage(err) }, { status: 500 });
  }
}
