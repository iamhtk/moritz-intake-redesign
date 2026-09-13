import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/intake/route';
import { createBrief } from './brief';
import { fieldsForMatter } from './matter-fields';

/**
 * The keyless intake through the real route (item 11).
 *
 * `offline-turn.test.ts` proves the script advances; this proves the route
 * actually reaches it. Worth its own file because the failure it guards
 * against is a one-line early return: the route used to answer `unauthorized`
 * before the script existed, and re-adding that guard in the wrong place would
 * leave every scripted test passing while a reviewer with no key still met an
 * error on their first message.
 *
 * Lives in `lib/` because that is what `vitest.config.ts` includes, and is
 * reached through the `@` alias like any other import.
 */

afterEach(() => vi.unstubAllEnvs());

/** Collect an SSE body into the events it carried. */
async function events(response: Response): Promise<Record<string, unknown>[]> {
  const body = await response.text();
  return body
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice(6)) as Record<string, unknown>);
}

function request(message: string, mode: 'intake' | 'waiting' = 'intake') {
  return new Request('http://localhost/api/intake', {
    method: 'POST',
    body: JSON.stringify({
      brief: createBrief('contract', fieldsForMatter('contract')),
      transcript: [],
      message,
      mode,
    }),
  });
}

describe('the intake route with no API key', () => {
  it('answers a message instead of refusing it', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(await POST(request('I need an NDA review')));

    // The old behaviour. If this ever comes back, the flow is unwalkable for
    // anyone who has not set a key.
    expect(collected.some((event) => event.type === 'error')).toBe(false);

    const done = collected.find((event) => event.type === 'done');
    expect(done).toBeDefined();
  });

  it('streams the reply rather than sending it in one lump', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(await POST(request('a supplier dispute')));
    const deltas = collected.filter((event) => event.type === 'delta');

    expect(deltas.length).toBeGreaterThan(1);
  });

  it('streams exactly the reply it finishes with', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(await POST(request('an NDA')));

    const streamed = collected
      .filter((event) => event.type === 'delta')
      .map((event) => event.text as string)
      .join('');
    const done = collected.find((event) => event.type === 'done') as {
      turn: { reply: string };
    };

    // The client renders the deltas and keeps them. A `done` reply that
    // differed would make the text change under the reader at the end.
    expect(streamed).toBe(done.turn.reply);
  });

  it('proposes a value for the row it was asked about', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(await POST(request('employment dispute')));
    const done = collected.find((event) => event.type === 'done') as {
      turn: { fieldUpdates: { key: string; source: string }[] };
    };

    expect(done.turn.fieldUpdates).toHaveLength(1);
    expect(done.turn.fieldUpdates[0]?.source).toBe('client');
  });

  it('strips the dashes the authored prompts are full of', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(await POST(request('employment dispute')));
    const done = collected.find((event) => event.type === 'done') as {
      turn: { reply: string };
    };

    // `matters/*.ts` prompts contain — literals, so the scripted path is
    // in fact the larger source of them.
    expect(done.turn.reply).not.toMatch(/[–—]/);
  });

  it('still rejects a malformed body before looking at the key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const response = await POST(
      new Request('http://localhost/api/intake', {
        method: 'POST',
        body: '{"nope":true}',
      }),
    );

    expect(response.status).toBe(400);
  });

  it('answers the waiting mode without proposing changes to a sent case', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const collected = await events(
      await POST(request('what did I send?', 'waiting')),
    );
    const done = collected.find((event) => event.type === 'done') as {
      turn: { fieldUpdates: unknown[] };
    };

    expect(done.turn.fieldUpdates).toEqual([]);
  });
});
