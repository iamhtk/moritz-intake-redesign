/**
 * Reads the server-sent events that `/api/intake` writes.
 *
 * The route sends `delta` events while the model is still writing, then exactly
 * one `done` (carrying the validated turn) or one `error`. Deltas are raw JSON
 * fragments, useful for showing the reply as it appears, never for changing
 * the brief. Only `done` may do that.
 */

import { isFailureKind, type FailureKind } from './failure';
import type { IntakeTurn } from './turn-schema';

export type IntakeStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; turn: IntakeTurn }
  /**
   * A named failure, never a message.
   *
   * The route used to put `err.message` in here and the chat rendered it, so a
   * missing key on the deployment showed the client an SDK sentence about
   * `apiKey` and `authToken`. The kind resolves to copy in `en.json`
   * (`lib/intake/failure.ts`), which is where a sentence a client reads
   * belongs.
   */
  | { type: 'error'; kind: FailureKind };

function toEvent(payload: string): IntakeStreamEvent | null {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (parsed.type === 'delta' && typeof parsed.text === 'string') {
      return { type: 'delta', text: parsed.text };
    }
    if (parsed.type === 'done' && typeof parsed.turn === 'object') {
      return { type: 'done', turn: parsed.turn as IntakeTurn };
    }
    if (parsed.type === 'error') {
      // An unrecognised kind becomes `unknown` rather than being passed
      // through: the client resolves it to copy, and a kind with no copy
      // renders as its own key on screen.
      return {
        type: 'error',
        kind: isFailureKind(parsed.kind) ? parsed.kind : 'unknown',
      };
    }
  } catch {
    // A half-arrived frame; the buffer logic below means we never see one.
  }
  return null;
}

/**
 * Yields each event as it arrives.
 *
 * Chunks do not respect message boundaries, so frames are buffered until a
 * blank line shows one is complete.
 */
export async function* readEventStream(
  response: Response,
): AsyncGenerator<IntakeStreamEvent> {
  const body = response.body;
  if (!body) {
    // No body at all is not a model failure; something between here and the
    // route dropped it, which is the same thing to the client as being offline.
    yield { type: 'error', kind: 'offline' };
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of frame.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const event = toEvent(line.slice(6));
          if (event) yield event;
        }

        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}
