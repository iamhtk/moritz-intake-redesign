import Anthropic from '@anthropic-ai/sdk';
import type {
  Base64ImageSource,
  ContentBlockParam,
  DocumentBlockParam,
  ImageBlockParam,
  Message,
  MessageParam,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages';
import { extractText, getDocumentProxy } from 'unpdf';
import type { FieldUpdate } from '@/lib/intake/brief';
import { logAnthropicUsage } from '@/lib/intake/log-usage';
import {
  failureKind,
  failureResponse,
  missingKeyResponse,
  stopReasonFailure,
} from '@/lib/intake/failure-server';
import { EXTRACTION_MODEL } from '@/lib/intake/models';
import { withoutUngroundedParties } from '@/lib/intake/party-fields';
import { INTAKE_EXTRACTION_SCHEMA, parseExtraction } from '@/lib/intake/schema';
import { NO_DASH_RULE, stripDashes } from '@/lib/intake/text';
import {
  findSourceDocument,
  locateQuote,
  type DocumentText,
} from '@/lib/intake/verify-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * No `cache_control` on this route. The extraction prompt is far below Haiku's
 * 4096-token cache floor, and the document payload changes on every call, so
 * there is no reusable prefix to cache. A marker that silently does nothing
 * reads as a working optimization to the next person.
 */
const EXTRACTION_SYSTEM_PROMPT = `You read the uploaded legal documents and pull out the facts a law firm needs to
open a matter.

There may be more than one document, and they belong to one matter: an
agreement with its order form and its data processing addendum, or a renewal
next to the original executed version. Read all of them and fill each field
once, from whichever document says it best. Where two documents disagree, use
the one that is signed or executed, and quote that one.

For every field you fill in, you must report:
 sourceNote where in the document you read it, in plain words, for example
 "clause 11.3" or "parties section, page 1". Just the location:
 the file name is worked out from your quote and added for you,
 so do not name the file yourself.
 sourceQuote the exact words from the document that the value came from,
 copied character for character, as ONE continuous passage.
 Do not stitch two clauses together with "...". If a value rests
 on two separate clauses, quote the single clearest one.
 confidence a whole number from 1 to 10: how sure you are that the words
 you quoted actually say the value you filled in.

HOW TO PICK THAT NUMBER

It is not about whether the document is a real document, and not about how
well written the clause is. It is one question: if the client opens the file
and reads your quote, will they agree it says what you put in the field?

 10 the clause states it outright and there is one way to read it.
 "terminate on not less than sixty (60) days written notice" for a
 notice period of 60 days.
 7-9 the clause says it, but you had to pick the operative words out of a
 longer provision, or normalise a date or an amount to write it down.
 4-6 the clause implies it and a careful reader would agree, but it is not
 stated. A term you worked out from a start date and a duration.
 1-3 the clause is the best evidence in the document and it is still thin.
 You are reasonably sure, and a lawyer might read it differently.

Use the whole range. These numbers are compared against each other across the
fields of one brief, so rating everything a 9 tells the client nothing and
hides the two rows that were actually worth their attention. A low number
costs nothing: every value read from a document is shown to the client to
confirm regardless, so a 3 is not a field you are giving up on, it is a field
you are pointing at.

The quote is checked against the real text of every document attached. If it
appears in none of them, the value is marked unverified and its source is
hidden from the client. So quote the document exactly, and never quote from
memory, from the conversation, or from what you expect a contract to say.

FILL IN EVERYTHING THE DOCUMENTS TOUCH, INCLUDING THE THIN ONES

The line to hold is between thin evidence and no evidence, not between
confident and unsure.

 If a document says something about a field, fill it in, even if the
 evidence is weak, even if you had to read between two clauses to get it, and
 even if you would rate it a 2. Rate it a 2 and move on. That is what the low
 end of the scale is for, and the client sees a "Check this" reading next to
 it and decides. A field you left blank out of caution is one nobody is
 checking, because nobody knows it was ever in question.

 Leave a field out only when the documents do not touch it at all. A missing
 field is fine, an invented one is not, and the difference is whether there is
 a real quote behind it.

 The quote check is the guard here, not your restraint. Every quote is matched
 against the real text of every attached document, and a value whose quote
 appears in none of them loses its source and is scored as an inference
 whatever you rated it. So you cannot smuggle a guess through by rating it
 high, which is exactly why filling in the thin ones is safe.

A field that asks for a NAME gets the name, in the shortest form that
identifies it, as somebody would write it on a letter. "Acme Holdings Ltd",
not "ACME HOLDINGS LTD, a company incorporated in England and Wales with
company number 07731298, whose registered office is at 1 Cheapside, London
EC2V 6DN". The recital belongs in sourceQuote, which is where the client goes
to check it.

A field that asks WHAT IS GOING ON gets a sentence, in your own words, saying
what the agreement covers and what it is for. That is what the firm reads
first, so write it as prose rather than as a heading: "A warehousing,
pick-and-pack and last-mile distribution agreement, on a twenty four month
initial term that renews automatically" is the right shape and length. Fill it
in whenever the documents describe the arrangement, which is almost always.

THE OTHER SIDE, and the one mistake you must not make.

A contract names two or more parties and the document cannot tell you which of
them the client is. Both are named in the same recital, in the same format,
often in the same sentence.

So apply this test before you fill in an other-side field. Has the client said,
in their own words, which party they are or who they are up against? "We signed
an MSA with Acme" passes: Acme is the other side and the client is the other
signatory. Nothing at all, or a note saying only that a document arrived,
FAILS. On a fail, leave the other-side field out entirely.

Do not break the tie any other way. Not by which party is named first, not by
Supplier over Customer, not by which one the document seems to be written for.
Naming the client's own company as their opponent is the worst outcome
available here: it reaches a lawyer as a fact about the matter, and the client
has to notice it on a panel of nine rows to stop it. An empty field asks them
one question. A wrong one asks them to catch us out.

Some fields are about the client, not about the document, and you can never
read them off a page. How soon the client needs help is the clearest case: a
contract is full of dates, notice periods and deadlines, and none of them say
how urgently this person wants advice. Leave a timeline or urgency field out
every time, even when the document is covered in dates. Same for what outcome
the client is hoping for, unless they have written it into the document
themselves.

${NO_DASH_RULE}
The one exception is sourceQuote, which is copied from the document and must
keep the document's own punctuation.`;

/**
 * One attached file.
 *
 * `mediaType` is carried per document rather than assumed, which is the whole
 * point of this shape. The previous version took bare base64 strings and built
 * every block as `application/pdf`, so a photo of a letter, an accepted type
 * offered by the picker, came back from the API as
 * `The PDF specified was not valid`.
 */
type ExtractDocument = {
  /** Shown to the client as the source, e.g. "vendor-agreement.pdf". */
  name: string;
  /** `application/pdf` or one of the four readable image types. */
  mediaType: string;
  /** Base64-encoded, no data-URL prefix. */
  data: string;
};

type ExtractRequestBody = {
  messages: MessageParam[];
  documents?: ExtractDocument[];
  /**
   * What the client said when they handed the documents over, on its own.
   *
   * It is already inside `messages`, wrapped in the instruction the caller
   * builds. Carried separately because the *absence* of it is a rule this
   * route enforces in code (see `party-fields.ts`), and inferring absence by
   * parsing a sentence back out of a prompt is the kind of thing that works
   * until somebody rewords the prompt.
   */
  clientSays?: string;
};

const PDF_MEDIA_TYPE = 'application/pdf';

/** Exactly what the Messages API will accept as an image block. */
const IMAGE_MEDIA_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

function isReadableMediaType(mediaType: string): boolean {
  return mediaType === PDF_MEDIA_TYPE || IMAGE_MEDIA_TYPES.includes(mediaType);
}

function isMessageParam(value: unknown): value is MessageParam {
  if (typeof value !== 'object' || value === null) return false;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  return (
    (role === 'user' || role === 'assistant') &&
    (typeof content === 'string' || Array.isArray(content))
  );
}

function parseDocument(value: unknown): ExtractDocument | null {
  if (typeof value !== 'object' || value === null) return null;
  const { name, mediaType, data } = value as Record<string, unknown>;
  if (typeof name !== 'string' || name === '') return null;
  if (typeof data !== 'string' || data === '') return null;
  // Refused here rather than passed through: an unreadable media type reaching
  // the API is a 400 the client cannot be told anything useful about.
  if (typeof mediaType !== 'string' || !isReadableMediaType(mediaType)) {
    return null;
  }
  return { name, mediaType, data };
}

function parseDocuments(value: unknown): ExtractDocument[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  const parsed = value.map(parseDocument);
  if (parsed.some((item) => item === null)) return undefined;
  return parsed as ExtractDocument[];
}

function parseBody(value: unknown): ExtractRequestBody | null {
  if (typeof value !== 'object' || value === null) return null;
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (!messages.every(isMessageParam)) return null;

  const rawSays = (value as { clientSays?: unknown }).clientSays;
  const clientSays = typeof rawSays === 'string' ? { clientSays: rawSays } : {};

  const rawDocs = (value as { documents?: unknown }).documents;
  if (rawDocs !== undefined) {
    const documents = parseDocuments(rawDocs);
    if (!documents) return null;
    return { messages, documents, ...clientSays };
  }

  return { messages, ...clientSays };
}

/**
 * The block a file becomes.
 *
 * A PDF is a `document` block and an image is an `image` block: the API has
 * both, the block type has to match what the bytes actually are, and getting
 * this wrong is not a degraded read but a 400.
 */
function toContentBlock(document: ExtractDocument): ContentBlockParam {
  if (document.mediaType === PDF_MEDIA_TYPE) {
    const block: DocumentBlockParam = {
      type: 'document',
      source: {
        type: 'base64',
        media_type: PDF_MEDIA_TYPE,
        data: document.data,
      },
    };
    return block;
  }

  const block: ImageBlockParam = {
    type: 'image',
    source: {
      type: 'base64',
      media_type: document.mediaType as Base64ImageSource['media_type'],
      data: document.data,
    },
  };
  return block;
}

function withDocuments(
  messages: MessageParam[],
  documents: ExtractDocument[] | undefined,
): MessageParam[] {
  if (!documents || documents.length === 0) return messages;

  /*
   * Named in the text, in the order the blocks appear.
   *
   * With one document the model never had to say which file it read. With
   * several it still does not have to, because the file is worked out from
   * which document the quote verifies against, but it reads better when the
   * model knows they have names: "the DPA" in a sourceNote is more use to a
   * client than "the second document".
   */
  const manifest =
    documents.length > 1
      ? `Attached, in order: ${documents.map((one) => one.name).join(', ')}.`
      : null;

  const docBlocks: ContentBlockParam[] = documents.map(toContentBlock);
  if (manifest) docBlocks.push({ type: 'text', text: manifest });
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
 * Our own read of each document, independent of the model's.
 *
 * Kept per document rather than concatenated, which is the change that makes
 * several attachments work properly. Verification does not just decide
 * *whether* a quote is real any more, it decides *which file* it came from, so
 * a value read out of the DPA is sourced to the DPA rather than to whichever
 * file happened to be dropped first. The matching itself lives in
 * `verify-source.ts` with the rest of the provenance rules.
 *
 * A photograph or a scan has no text layer to return. That is not an error, the
 * model still reads the pages, but with nothing to check a quote against every
 * field it proposes from that file ends up unverified.
 *
 * Read in parallel: each is an independent parse, and a client who attached
 * four contracts should not wait for four sequential ones.
 */
async function readDocumentTexts(
  documents: ExtractDocument[] | undefined,
): Promise<DocumentText[]> {
  if (!documents || documents.length === 0) return [];

  return Promise.all(
    documents.map(async ({ name, mediaType, data }) => {
      // Only a PDF has a text layer worth trying for.
      if (mediaType !== PDF_MEDIA_TYPE) return { name, text: '' };
      try {
        const bytes = new Uint8Array(Buffer.from(data, 'base64'));
        const pdf = await getDocumentProxy(bytes);
        const { text } = await extractText(pdf, { mergePages: true });
        return { name, text };
      } catch {
        // Not a readable PDF. Verification simply fails closed for this one.
        return { name, text: '' };
      }
    }),
  );
}

function textFromMessage(content: Message['content']): string {
  return content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  /*
   * No key, no model. Answered as `unauthorized` before anything is read or
   * spent, rather than letting `new Anthropic()` throw. See
   * `missingKeyResponse`.
   */
  const noKey = missingKeyResponse('extract');
  if (noKey) return noKey;

  const body = parseBody(json);
  if (!body) {
    return Response.json(
      {
        error:
          'Body must include a non-empty messages array and an optional documents array of { name, mediaType, data }, where mediaType is application/pdf or a readable image type',
      },
      { status: 400 },
    );
  }

  try {
    const anthropic = new Anthropic();

    // Read the documents ourselves and ask the model to read them, in parallel.
    const [documentTexts, message] = await Promise.all([
      readDocumentTexts(body.documents),
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

    /*
     * Why the read stopped, before anything it returned is read.
     *
     * A refusal and a truncation both come back as a successful call, so
     * without this the checks below catch them as "non-JSON text" and the
     * client is told the document could not be read when in fact it was read
     * and the answer was declined or cut off. A scan of an NDA is exactly the
     * sort of upload that can trip a classifier, and telling that client to
     * "try again" is advice that cannot work.
     */
    const stopped = stopReasonFailure(message);
    if (stopped) {
      return failureResponse(
        'extract',
        stopped,
        new Error(
          stopped === 'refused'
            ? `stop_details: ${JSON.stringify(message.stop_details)}`
            : `output_tokens: ${message.usage.output_tokens}`,
        ),
      );
    }

    const raw = textFromMessage(message.content);
    if (!raw) {
      return failureResponse(
        'extract',
        'unreadable',
        new Error('no text content'),
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw) as unknown;
    } catch {
      return failureResponse(
        'extract',
        'unreadable',
        new Error(`not JSON: ${raw.slice(0, 200)}`),
      );
    }

    const extraction = parseExtraction(parsedJson);
    if (!extraction) {
      return failureResponse(
        'extract',
        'unreadable',
        new Error('JSON did not match the extraction shape'),
      );
    }

    /*
     * The first decision the model does not get to make: whether a field about
     * the client can be read off a document at all.
     *
     * T36 found the reader naming the client's own company as the other side
     * on a two-party contract: once with no accompanying words, and then again
     * with them, having got it right on the run before. The prompt spells the
     * tie-break out and it is still a coin flip, because the document plainly
     * answers "who are the parties" and a reader asked to fill in what it can
     * will answer it. So the value has to be traceable to the client's own
     * words or it does not land. See `party-fields.ts`.
     */
    const { kept, withheld } = withoutUngroundedParties(
      extraction.fields,
      body.clientSays,
    );
    if (withheld.length > 0) {
      console.log(
        `[extract] withheld ${withheld.join(', ')}: the client's own words do not name that party`,
      );
    }

    // The decision the model does not get to make.
    let verifiedCount = 0;
    const fields: FieldUpdate[] = kept.map((field) => {
      const from = findSourceDocument(field.sourceQuote, documentTexts);
      if (from) verifiedCount += 1;

      // "vendor-agreement.pdf, clause 11.3", the client should be able to go
      // and look, which means naming the file as well as the place in it. The
      // file is the one whose text the quote was found in, not the one the
      // model said, and not whichever was attached first.
      const where = stripDashes(field.sourceNote);
      const sourceNote = from
        ? [from.name, where].filter(Boolean).join(', ')
        : null;

      return {
        key: field.key,
        value: stripDashes(field.value),
        // Everything from a document arrives unconfirmed. Verification decides
        // whether we show a source, never whether the client must confirm.
        source: from ? 'document' : 'inferred',
        /*
         * The model's own 1 to 10, passed through rather than overridden.
         *
         * Safe to pass through because it cannot reach past the band the line
         * above just chose: an unverified read is scored as an inference
         * whatever the model rated it, so a 10 on a quote that appears in no
         * attached file buys nothing. Within the band it is the only thing
         * separating a clause read straight off the page from one pieced
         * together — which used to be a distinction the client never saw,
         * because every extracted field arrived with the same flat value.
         */
        confidence: field.confidence,
        sourceNote,
        // Never cleaned up: this is a verbatim quotation, checked against the
        // real text. Rewriting its punctuation would misquote the document.
        sourceQuote: from ? field.sourceQuote : null,
        /*
         * The quote where it sits in the document (L3).
         *
         * Computed here because this is the only place the document's text
         * layer exists: `unpdf` ran a few lines up to verify the quote, and the
         * text is thrown away when the request ends. Sending the *passage*
         * rather than the whole document is the point — three sentences travel
         * to the client, a fifty-page contract does not, and the client's own
         * bytes never leave their machine twice.
         *
         * Only for a verified source. An unverified quote has already lost its
         * claim to come from anywhere, so a passage under it would be context
         * for something the brief no longer says.
         */
        sourcePassage: from ? locateQuote(field.sourceQuote, from.text) : null,
      };
    });

    return Response.json({
      matterType: extraction.matterType,
      fields,
      /**
       * False when none of the attachments had a text layer, which is the case
       * for photos and scans. With a mix, the ones that did are still checked.
       */
      documentTextAvailable: documentTexts.some(
        (document) => document.text.trim() !== '',
      ),
      verifiedCount,
      /** How many files were read, so the client can say so in one sentence. */
      documentCount: body.documents?.length ?? 0,
    });
  } catch (err) {
    return failureResponse('extract', failureKind(err), err);
  }
}
