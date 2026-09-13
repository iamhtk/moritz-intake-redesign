/**
 * The turn contract: what one conversational exchange returns.
 *
 * Two deliberate constraints, both of which exist to keep the model inside the
 * lane the brief invariants define (see `brief.ts`):
 *
 * - `reply` is the FIRST property. Constrained decoding emits properties in
 * schema order, so the visible text arrives at the front of the stream and
 * can be rendered before the object closes.
 * - `source` cannot be `document` here. Only `/api/extract` may claim a
 * document source, and only after verifying the quote against the extracted
 * text. A conversational turn has no document in front of it, so the schema
 * removes the option rather than trusting the prompt to discourage it.
 */

import type { Brief } from './brief';
import { fieldState } from './brief';
import { clampRating, RATING_MAX, RATING_SCALE } from './confidence';

/** Sources a conversational turn is allowed to claim. Note: no `document`. */
export type TurnFieldSource = 'client' | 'inferred';

export type TurnFieldUpdate = {
  key: string;
  value: string;
  source: TurnFieldSource;
  /**
   * How sure the model is of this particular value, 1 to 10.
   *
   * Positions the value inside the band its provenance earned; it cannot
   * change the band. See `confidence.ts` for why the model is asked for a
   * number at all, and for why that number cannot open the confirm gate.
   */
  confidence: number;
  /**
   * One short line of plain-English *why*, for an `inferred` value (L4).
   *
   * `''` where the model has nothing to add, which is the expected answer for
   * a `client` value: repeating the client's own sentence back as an
   * explanation is worse than silence. `applyFieldUpdates` discards it on
   * anything that is not `inferred`, so this being empty is the normal case
   * rather than a gap.
   *
   * Required-with-`''` rather than optional, matching `askingAbout` and
   * `observation` above and for the same reason: each optional property grows
   * the compiled grammar, and the repo's API rules ask for as few as possible.
   */
  reasoning: string;
};

export type IntakeTurn = {
  /** What the client sees. Streams first. */
  reply: string;
  /** Proposed changes. Every one arrives unconfirmed. */
  fieldUpdates: TurnFieldUpdate[];
  /** Field key the reply is asking about, or `''` for none. */
  askingAbout: string;
  /** The model's view of completeness. Advisory, `canSubmit` decides. */
  nothingRequiredMissing: boolean;
  /**
   * One-tap answers to the question in `reply`, or `[]` for none.
   *
   * ─────────────────────────────────────────────────────────────────────────
   * LABELS ONLY, AND THAT IS THE SAFETY PROPERTY.
   * ─────────────────────────────────────────────────────────────────────────
   *
   * An option is a string the client can click *instead of typing it*. Clicking
   * one sends that exact text as a client message, which is what the preset
   * chips have always done (`onChooseChip` sends the label, not the value). So
   * an option carries no key, no value and no id: there is nothing for the
   * model to get wrong, and nothing here can reach the brief except through the
   * same path as anything the client types.
   *
   * That matters because the alternative was letting the model emit
   * `{label, value}` pairs against the preset chips' canonical values — and a
   * model writing `employment_dispute` where the router expects `employment`
   * would break matter routing silently. Labels round-trip through the ordinary
   * message path, so they cannot.
   *
   * Capped and cleaned by `parseOptions`: a row of nine options is a menu, and
   * a menu is the questionnaire this flow exists to replace.
   */
  options: string[];
  /**
   * One sentence about two facts in the case that genuinely disagree, or `''`
   * (item 6).
   *
   * `''` is the normal answer and the one the prompt pushes towards. Most
   * intakes contain no contradiction, and an observation invented to look
   * perceptive is worse than silence: it spends the client's trust on a
   * sentence a lawyer will then have to un-read.
   *
   * The turn may return one every time and the app will ignore all but the
   * first, because "at most one per intake" is not a rule a stateless call can
   * keep. See `noteObservation` in `brief.ts`.
   */
  observation: string;
};

/**
 * `askingAbout` and `observation` are plain required strings with `''` meaning
 * "none", rather than nullable or genuinely optional properties: the repo's API
 * rules call for keeping optional fields to a minimum because each one grows
 * the compiled grammar. `observation` is optional in the product sense (it is
 * usually empty) and required in the schema sense, which is the cheaper of the
 * two ways to express it.
 */
export const INTAKE_TURN_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    fieldUpdates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
          source: { type: 'string', enum: ['client', 'inferred'] },
          /*
           * An enum rather than `{minimum: 1, maximum: 10}` — structured
           * outputs strip numerical constraints, so a range here would be a
           * rule the grammar never enforced. See `RATING_SCALE`.
           * `parseUpdate` still clamps, for the schemaless paths.
           */
          confidence: { type: 'integer', enum: RATING_SCALE },
          reasoning: { type: 'string' },
        },
        required: ['key', 'value', 'source', 'confidence', 'reasoning'],
        additionalProperties: false,
      },
    },
    askingAbout: { type: 'string' },
    nothingRequiredMissing: { type: 'boolean' },
    /*
     * An array of plain strings, not of objects. One string per option is the
     * smallest thing the grammar can carry for this, and it is also the only
     * shape with nothing to drift: see the note on `IntakeTurn.options`.
     */
    options: { type: 'array', items: { type: 'string' } },
    observation: { type: 'string' },
  },
  required: [
    'reply',
    'fieldUpdates',
    'askingAbout',
    'nothingRequiredMissing',
    'options',
    'observation',
  ],
  additionalProperties: false,
} as const;

const TURN_SOURCES: ReadonlySet<string> = new Set(['client', 'inferred']);

function parseUpdate(value: unknown): TurnFieldUpdate | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const { key, value: fieldValue, source, confidence, reasoning } = record;
  if (typeof key !== 'string' || key.trim() === '') return null;
  if (typeof fieldValue !== 'string' || fieldValue.trim() === '') return null;
  if (typeof source !== 'string' || !TURN_SOURCES.has(source)) return null;
  /*
   * A non-number drops the update, an out-of-range number is clamped. The
   * grammar already restricts this to 1 to 10, so neither branch should fire
   * in practice — but the schema is enforced by the API and this is enforced
   * by us, and a value arriving with no usable rating has nothing to position
   * it inside its band.
   */
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    return null;
  }
  return {
    key,
    value: fieldValue,
    source: source as TurnFieldSource,
    confidence: clampRating(confidence),
    /*
     * A missing or non-string reason is `''`, never a dropped update. It is the
     * one property here whose absence costs the client nothing: the value is
     * still true and still theirs to check, so failing the whole update over a
     * missing explanation would trade a field for a sentence.
     */
    reasoning: typeof reasoning === 'string' ? reasoning.trim() : '',
  };
}

/**
 * Validate a parsed model response. Malformed updates are dropped individually
 * rather than failing the whole turn, losing one field update is recoverable,
 * losing the reply strands the client mid-conversation.
 */
/**
 * At most this many one-tap answers under a reply.
 *
 * Five, because the preset chip sets top out at five (the six matter types are
 * the opening screen's own grid, not a chip row) and because the sixth option
 * is where a row of suggestions stops reading as "here, pick one" and starts
 * reading as a form the client has to assess. L20's finding, applied to the
 * chips: a row of choices hands a decision to somebody with no basis for
 * making it, and the longer the row the more true that is.
 */
export const MAX_TURN_OPTIONS = 5;

/**
 * Longer than this and it is a sentence, not a button.
 *
 * Options wrap in a 390px column, so a long one is a paragraph with a border
 * round it. Dropped rather than truncated: an option cut off mid-word is a
 * choice the client cannot read, and the reply above it is still there to
 * answer in their own words.
 */
export const MAX_OPTION_LENGTH = 60;

/**
 * The one-tap answers, cleaned.
 *
 * Everything here is a drop rather than a repair, and the reason is the same
 * each time: the reply is a real question that the client can always answer by
 * typing, so a malformed option costs nothing and a repaired one is a button
 * whose words we made up.
 *
 * De-duplicated case-insensitively because the model offering "Yes" and "yes"
 * in one row is two buttons that do the same thing, and the client has to read
 * both to find that out.
 */
export function parseOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const options: string[] = [];
  const seen = new Set<string>();

  for (const candidate of value) {
    if (options.length >= MAX_TURN_OPTIONS) break;
    if (typeof candidate !== 'string') continue;

    const label = candidate.trim();
    if (label === '' || label.length > MAX_OPTION_LENGTH) continue;

    const key = label.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    options.push(label);
  }

  /*
   * One option is not a choice, it is a suggestion the client has to take or
   * refuse — and refusing it means typing anyway. Dropped, so the reply stands
   * on its own rather than carrying a single button that implies the answer.
   */
  return options.length < 2 ? [] : options;
}

export function parseIntakeTurn(value: unknown): IntakeTurn | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;

  const {
    reply,
    fieldUpdates,
    askingAbout,
    nothingRequiredMissing,
    options,
    observation,
  } = record;
  if (typeof reply !== 'string' || reply.trim() === '') return null;

  const updates: TurnFieldUpdate[] = [];
  if (Array.isArray(fieldUpdates)) {
    for (const candidate of fieldUpdates) {
      const parsed = parseUpdate(candidate);
      if (parsed) updates.push(parsed);
    }
  }

  return {
    reply,
    fieldUpdates: updates,
    askingAbout: typeof askingAbout === 'string' ? askingAbout : '',
    nothingRequiredMissing: nothingRequiredMissing === true,
    options: parseOptions(options),
    observation: typeof observation === 'string' ? observation.trim() : '',
  };
}

/**
 * Pull the `reply` string out of a partially streamed JSON object, so the
 * client can render text before the response closes.
 *
 * Returns `null` until enough of the string has arrived to be worth showing.
 * Handles escape sequences so a quote inside the reply does not truncate it.
 */
export function extractPartialReply(buffer: string): string | null {
  const start = buffer.indexOf('"reply"');
  if (start === -1) return null;

  const openQuote = buffer.indexOf('"', buffer.indexOf(':', start) + 1);
  if (openQuote === -1) return null;

  let out = '';
  for (let i = openQuote + 1; i < buffer.length; i += 1) {
    const char = buffer[i];
    if (char === '\\') {
      const next = buffer[i + 1];
      if (next === undefined) break; // escape split across chunks
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === 'u') {
        const code = buffer.slice(i + 2, i + 6);
        if (code.length < 4) break;
        out += String.fromCharCode(parseInt(code, 16));
        i += 4;
      } else out += next;
      i += 1;
      continue;
    }
    if (char === '"') return out; // closed, this is the whole reply
    out += char;
  }

  return out.length > 0 ? out : null;
}

/**
 * The brief as the model sees it each turn: the durable memory of the session.
 *
 * Sent in the user message rather than the system block, so the cached system
 * prefix stays byte-identical for the whole session.
 */
export function renderBriefState(brief: Brief): string {
  const lines = brief.fields.map((field) => {
    const state = fieldState(field);
    if (state === 'missing') {
      return `- ${field.key} (${field.label})${field.required ? '' : ' [optional]'}: MISSING`;
    }
    const origin = field.source === null ? 'unknown' : field.source;
    /*
     * A confirmed row shows the lock instead of the rating, and that is not
     * just brevity. The rating on a confirmed row is the one the model gave
     * before the client agreed with the value or replaced it, so showing it
     * next to a value the client now owns invites the model to argue with a
     * settled line on the strength of its own earlier doubt.
     */
    if (field.confirmed) {
      return `- ${field.key} (${field.label}): ${field.value} [from ${origin}, CONFIRMED BY CLIENT, do not change]`;
    }
    const rating =
      field.confidence === null
        ? 'unrated'
        : `confidence ${field.confidence}/${RATING_MAX}`;
    return `- ${field.key} (${field.label}): ${field.value} [from ${origin}, ${rating}]`;
  });

  /*
   * Item 6: whether the one observation has been spent.
   *
   * Stated rather than left implicit, because the transcript window is six
   * turns and an observation made on turn two is invisible by turn nine. The
   * app enforces the limit either way, but a model that cannot see it has been
   * used will keep offering new ones, and every one it offers is a sentence
   * that gets dropped after being generated.
   */
  const observation =
    brief.observation === null
      ? 'OBSERVATION: none made yet. You may make one, if and only if two facts genuinely disagree.'
      : `OBSERVATION: already made, do not make another. It was: ${brief.observation}`;

  return `CURRENT BRIEF (matter: ${brief.matterId})\n${lines.join('\n')}\n\n${observation}`;
}

/**
 * The turn contract after the case has been sent, which is one property (the
 * post-submit concierge).
 *
 * A separate schema rather than the intake's with a prompt rule against using
 * it, because every property in a structured-output schema is a property the
 * grammar can emit and the model will occasionally be tempted to. On a sealed
 * brief `fieldUpdates` is the tempting one: `applyFieldUpdates` is never called
 * on this path, so a value the model proposed here would be generated, paid
 * for, dropped in silence, and then referred to in the reply as though it had
 * landed. Removing the property is the only version of that rule the model
 * cannot break.
 *
 * It also makes the call cheaper in the way that matters most on this surface.
 * The intake's grammar carries a whole array of five-property update objects;
 * this one carries a string, so the reply starts arriving sooner, which is the
 * entire perceived quality of a chat that exists to answer one quick question.
 */
export const WAITING_TURN_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
  },
  required: ['reply'],
  additionalProperties: false,
} as const;

/**
 * Validate a waiting turn, and widen it to the shape the client already reads.
 *
 * Returns an `IntakeTurn` rather than a narrower type on purpose. The stream
 * route, `stream-client.ts` and `runTurn` are one pipeline that this mode has no
 * reason to fork: the reply streams through `extractPartialReply` identically
 * (the property is first in both schemas), and the only difference is that the
 * other four values are constants. Forking the pipeline to save four constants
 * would double the surface where a failure kind, a retry or a dash strip has to
 * be got right.
 *
 * The constants are the sealed brief's own answers, not placeholders: there are
 * no updates, nothing is being asked about, nothing is missing because the case
 * has gone, no options because a sealed brief has nothing to offer a one-tap
 * answer *to*, and the one observation was either made during the intake or
 * never.
 */
export function parseWaitingTurn(value: unknown): IntakeTurn | null {
  if (typeof value !== 'object' || value === null) return null;
  const { reply } = value as Record<string, unknown>;
  if (typeof reply !== 'string' || reply.trim() === '') return null;

  return {
    reply,
    fieldUpdates: [],
    askingAbout: '',
    nothingRequiredMissing: true,
    options: [],
    observation: '',
  };
}

/**
 * The sent case as the concierge sees it: a record, not a form.
 *
 * `renderBriefState` is the wrong context here and wrong in a way that would
 * show. It marks unconfirmed rows with the model's own confidence rating, which
 * invites a reply arguing with a value the client has already sent, and it ends
 * with a paragraph inviting an observation the sealed brief has nowhere to put.
 * Both are the intake's business. What a waiting client's question needs is the
 * flat fact of what they sent, so that "what did I put down as the other side"
 * is answerable without the model hedging about provenance it no longer needs.
 *
 * Empty fields are dropped rather than printed as MISSING. A sent case cannot
 * have anything filled in, so a list of gaps would only tempt the model into
 * offering to fill them.
 */
export function renderSentBrief(brief: Brief): string {
  const lines = brief.fields
    .filter((field) => field.value !== null)
    .map((field) => `- ${field.label}: ${field.value}`);

  return `THE CASE THE CLIENT HAS SENT (matter: ${brief.matterId})\nThis is a finished record. It cannot be changed and you are not collecting anything.\n${lines.join('\n')}`;
}
