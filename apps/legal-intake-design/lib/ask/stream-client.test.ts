import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readAskStream, type AskStreamEvent } from './stream-client';

/**
 * The stream reader, and the route's failure discipline (§8.8).
 *
 * The interesting case is the split frame. A chunk boundary does not respect a
 * message boundary, and on localhost the whole response usually arrives at once
 * so the bug never shows in development — which is exactly why it is worth a
 * test that forces the split.
 */

/** A `Response` whose body arrives in exactly these chunks. */
function streamOf(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  );
}

const frame = (event: Record<string, unknown>) =>
  `data: ${JSON.stringify(event)}\n\n`;

async function collect(response: Response): Promise<AskStreamEvent[]> {
  const events: AskStreamEvent[] = [];
  for await (const event of readAskStream(response)) events.push(event);
  return events;
}

describe('reading the stream', () => {
  it('reads deltas then the settled answer', async () => {
    const events = await collect(
      streamOf([
        frame({ type: 'delta', text: 'You have ' }),
        frame({ type: 'delta', text: 'four cases.' }),
        frame({ type: 'done', answer: 'You have four cases.' }),
      ]),
    );
    expect(events).toEqual([
      { type: 'delta', text: 'You have ' },
      { type: 'delta', text: 'four cases.' },
      { type: 'done', answer: 'You have four cases.' },
    ]);
  });

  /*
   * The whole reason the buffering exists. The frame is cut in the middle of
   * its JSON, across two reads. A reader that parsed per chunk would throw on
   * the first half and drop the event.
   */
  it('reassembles a frame split across two chunks', async () => {
    const whole = frame({ type: 'done', answer: 'Nothing is waiting on you.' });
    const cut = Math.floor(whole.length / 2);
    const events = await collect(
      streamOf([whole.slice(0, cut), whole.slice(cut)]),
    );
    expect(events).toEqual([
      { type: 'done', answer: 'Nothing is waiting on you.' },
    ]);
  });

  it('reads several frames delivered in one chunk', async () => {
    const events = await collect(
      streamOf([
        frame({ type: 'delta', text: 'a' }) +
          frame({ type: 'delta', text: 'b' }) +
          frame({ type: 'done', answer: 'ab' }),
      ]),
    );
    expect(events).toHaveLength(3);
  });

  it('survives a multi-byte character split across two chunks', async () => {
    // "Aélita" — the é is two bytes, and the split falls between them.
    const whole = new TextEncoder().encode(
      frame({ type: 'done', answer: 'Aélita Jacob' }),
    );
    const at = whole.indexOf(0xc3) + 1;
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(whole.slice(0, at));
          controller.enqueue(whole.slice(at));
          controller.close();
        },
      }),
    );
    expect(await collect(response)).toEqual([
      { type: 'done', answer: 'Aélita Jacob' },
    ]);
  });
});

describe('failures reaching the client', () => {
  it('passes a known kind through', async () => {
    expect(
      await collect(streamOf([frame({ type: 'error', kind: 'busy' })])),
    ).toEqual([{ type: 'error', kind: 'busy' }]);
  });

  /*
   * A kind the client has no copy for would render as `ask.error.whatever` on
   * screen, because `next-intl` prints a missing key. So anything unrecognised
   * becomes `unknown`, which has a sentence.
   */
  it('turns an unrecognised kind into unknown', async () => {
    expect(
      await collect(
        streamOf([frame({ type: 'error', kind: 'quotaExceeded' })]),
      ),
    ).toEqual([{ type: 'error', kind: 'unknown' }]);
    expect(await collect(streamOf([frame({ type: 'error' })]))).toEqual([
      { type: 'error', kind: 'unknown' },
    ]);
  });

  it('reports a missing body as offline', async () => {
    expect(await collect(new Response(null))).toEqual([
      { type: 'error', kind: 'offline' },
    ]);
  });

  /*
   * A non-OK response carries no `error` frame, because the route answers this
   * class of request before it opens a stream: the 400 on a malformed body and
   * the 403 on a role Ask is not offered to.
   *
   * Without the status branch the JSON body yields no `data:` frames, the
   * generator ends having emitted nothing, and the panel keeps an assistant
   * turn that stays empty forever — no copy, no retry, `busy` already false.
   * An empty bubble is the one outcome §8.8 rules out by name.
   */
  it.each([
    [403, 'unauthorized'],
    [401, 'unauthorized'],
    [400, 'unknown'],
    [429, 'busy'],
    [500, 'busy'],
  ] as const)('maps a %i into the %s kind', async (status, kind) => {
    const response = new Response(JSON.stringify({ error: 'nope' }), {
      status,
    });
    expect(await collect(response)).toEqual([{ type: 'error', kind }]);
  });

  /* The reason the branch cannot just be "emit nothing". */
  it('never ends a non-OK response without saying anything', async () => {
    const events = await collect(
      new Response(JSON.stringify({ error: 'nope' }), { status: 403 }),
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('error');
  });

  it('drops a malformed frame rather than throwing', async () => {
    const events = await collect(
      streamOf([
        'data: not json at all\n\n',
        frame({ type: 'done', answer: 'ok' }),
      ]),
    );
    expect(events).toEqual([{ type: 'done', answer: 'ok' }]);
  });

  it('ignores a frame whose shape does not match its type', async () => {
    const events = await collect(
      streamOf([
        frame({ type: 'delta' }),
        frame({ type: 'done', answer: 42 }),
        frame({ type: 'done', answer: 'ok' }),
      ]),
    );
    expect(events).toEqual([{ type: 'done', answer: 'ok' }]);
  });
});

/**
 * §8.8's last row: assert the route emits a *kind*, never `err.message`.
 *
 * Read as source rather than exercised, because running the route means
 * running the model. That is a fair trade for this particular claim: the defect
 * being guarded against is a *textual* one — an `err.message` reaching a
 * `send()` call — and it is visible in the source with no ambiguity. The
 * regression this catches is someone adding a helpful `detail` field to the
 * event on a bad day.
 */
describe('the route never sends a provider string', () => {
  const raw = readFileSync(join(process.cwd(), 'app/api/ask/route.ts'), 'utf8');

  /*
   * Comments stripped before anything is asserted, the same discipline
   * `notes/check-colours.sh` uses. This file's own doc comment *quotes* the
   * source route's `temperature: 0.3` in order to explain why we must never set
   * it, and a naive substring check reads that explanation as the offence. A
   * rule that fails on the sentence documenting it teaches people to delete the
   * sentence.
   */
  const source = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  /** Every `send({...})` argument in the route. */
  const sends = [...source.matchAll(/send\(\{([^}]*)\}\)/g)].map(
    (match) => match[1]!,
  );

  it('has send calls to check', () => {
    expect(sends.length).toBeGreaterThan(2);
  });

  it('never puts a message, a detail or an error object on the wire', () => {
    for (const argument of sends) {
      expect(argument).not.toMatch(/\bmessage\b\s*:/);
      expect(argument).not.toMatch(/\bdetail\b/);
      expect(argument).not.toMatch(/err(or)?\.message/);
    }
  });

  it('sends a kind on every error event', () => {
    const errorSends = sends.filter((argument) =>
      argument.includes("type: 'error'"),
    );
    expect(errorSends.length).toBeGreaterThan(0);
    for (const argument of errorSends) {
      expect(argument).toContain('kind');
    }
  });

  /* P3: any of these is a 400 on these models. */
  it.each(['temperature', 'top_p', 'top_k'])('never sets %s', (parameter) => {
    expect(source).not.toContain(`${parameter}:`);
  });

  it('sets an explicit max_tokens', () => {
    expect(source).toMatch(/max_tokens:/);
  });

  /* P2: the model id is the correct one and must not be "modernised". */
  it('uses the shared EXTRACTION_MODEL constant rather than a literal', () => {
    expect(source).toContain('EXTRACTION_MODEL');
    expect(source).not.toMatch(/model:\s*['"]/);
  });

  /*
   * The boundary: the role must come from the cookie, never from the body. A
   * `role` read out of the request would be a privilege escalation by `curl`.
   */
  it('resolves the role server-side and not from the request body', () => {
    expect(source).toContain('getCurrentRole()');
    const parseBody = source.slice(
      source.indexOf('function parseBody'),
      source.indexOf('function sse'),
    );
    expect(parseBody).not.toContain('role');
  });
});
