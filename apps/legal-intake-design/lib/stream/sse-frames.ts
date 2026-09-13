/**
 * Reading server-sent event frames off a `Response`, once (task N5).
 *
 * §8.6 asks for the frame-buffering loop to be extracted to a shared generic
 * rather than copy-pasted, and this is that generic. It knows nothing about
 * what the frames mean: it yields `data:` payloads as strings, and each caller
 * parses its own event union.
 *
 * The buffering is the part worth having in one place, because the bug it
 * avoids is invisible in development and reliable in production. A chunk
 * boundary does not respect a message boundary: a read can return
 * `data: {"type":"del` and the rest can arrive in the next read, hundreds of
 * milliseconds later. `JSON.parse` on the first half throws, and a reader that
 * parses per chunk drops that event silently. On localhost the whole response
 * usually arrives in one chunk and the bug never shows. So frames are held
 * until a blank line proves one is complete.
 *
 * **Why this is a new file rather than a refactor of
 * `lib/intake/stream-client.ts`.** That module has the same loop and predates
 * this one, and folding it in here is the tidier end state. It was left alone
 * deliberately: it is working, untested-in-isolation code on the critical path
 * of the intake flow, and at the time of writing another change was in flight
 * across `lib/intake/`. Restructuring a working module to make a new one fit
 * is the trade this run was told not to make. §8.6 sanctions saying so out
 * loud rather than forcing it, so: **TODO(intake) — point
 * `readEventStream` at `readSseFrames` when `lib/intake/` is quiet.** The
 * duplication is one loop, and it is recorded rather than hidden.
 */

/**
 * Yields the payload of each complete `data:` frame, in order.
 *
 * Returns without yielding anything when the response has no body — the caller
 * decides what that means, because "no body" is not a model failure and only
 * the caller knows which of its own error kinds fits.
 */
export async function* readSseFrames(
  response: Response,
): AsyncGenerator<string> {
  const body = response.body;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      // `stream: true` so a multi-byte character split across two reads is
      // held rather than decoded into a replacement character.
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of frame.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          yield line.slice(6);
        }

        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    // `finally` rather than after the loop: a consumer that breaks out of its
    // `for await` early — the reader closed the panel mid-answer — must still
    // release the lock, or the body stays locked for the page's lifetime.
    reader.releaseLock();
  }
}
