/**
 * Reads what `/api/ask` writes (task N5).
 *
 * The route sends `delta` events while the model is still writing, then exactly
 * one `done` carrying the settled answer, or one `error` carrying a kind. The
 * deltas are for reading as they arrive; only `done` is the answer, and only
 * `done` may be handed to `extractAskActions` — a half-written `M-2026-01` is a
 * different reference from `M-2026-0126`, so buttons derived from a partial
 * stream would appear, change and vanish mid-sentence.
 *
 * Frame buffering comes from `lib/stream/sse-frames.ts`; this module is only
 * the event union and its parsing.
 */

import {
  failureKindOfResponse,
  isFailureKind,
  type FailureKind,
} from '@/lib/intake/failure';
import { readSseFrames } from '@/lib/stream/sse-frames';

export type AskStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; answer: string }
  /**
   * A named failure, never a message (P4).
   *
   * The kind resolves to copy under `ask.error.*`. The seven kinds are reused
   * from `lib/intake/failure.ts` and none were added: a new kind with no
   * sentence renders as its own key on screen, which is the failure mode the
   * intake flow already paid for once.
   */
  | { type: 'error'; kind: FailureKind };

function toEvent(payload: string): AskStreamEvent | null {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (parsed.type === 'delta' && typeof parsed.text === 'string') {
      return { type: 'delta', text: parsed.text };
    }
    if (parsed.type === 'done' && typeof parsed.answer === 'string') {
      return { type: 'done', answer: parsed.answer };
    }
    if (parsed.type === 'error') {
      // An unrecognised kind becomes `unknown` rather than passing through:
      // the client resolves a kind to copy, and a kind with no copy renders as
      // `ask.error.whatever` on screen.
      return {
        type: 'error',
        kind: isFailureKind(parsed.kind) ? parsed.kind : 'unknown',
      };
    }
  } catch {
    // Not JSON. The frame buffering means a half-arrived frame never gets here,
    // so this is a malformed event rather than a truncated one, and dropping it
    // is right: the stream still ends in a `done` or an `error`.
  }
  return null;
}

/** Yields each event as it arrives. */
export async function* readAskStream(
  response: Response,
): AsyncGenerator<AskStreamEvent> {
  /*
   * A non-OK response carries no `error` event, because the route answers this
   * class of request before it opens a stream: the 400 on a malformed body,
   * and the 403 on a role Ask is not offered to. Without this branch the JSON
   * body yields no `data:` frames, the generator ends having emitted nothing,
   * and the panel is left holding an assistant turn that stays empty forever —
   * no copy, no retry, `busy` already false.
   *
   * `failureKindOfResponse` believes the `kind` the route put in the body and
   * falls back to the status. That distinction is what makes a missing
   * `ANTHROPIC_API_KEY` read as `unauthorized` — not retryable, so no button —
   * rather than as a 503-shaped `busy` telling the reader to wait.
   */
  if (!response.ok) {
    yield { type: 'error', kind: await failureKindOfResponse(response) };
    return;
  }

  if (!response.body) {
    // Nothing between here and the route kept the body, which to the reader is
    // the same thing as being offline.
    yield { type: 'error', kind: 'offline' };
    return;
  }

  for await (const payload of readSseFrames(response)) {
    const event = toEvent(payload);
    if (event) yield event;
  }
}
