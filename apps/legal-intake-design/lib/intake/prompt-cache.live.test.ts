import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { createBrief } from './brief';
import { fieldsForMatter } from './matter-fields';
import { CONVERSATION_MODEL } from './models';
import { INTAKE_SYSTEM_PROMPT } from './system-prompt';
import { INTAKE_TURN_SCHEMA, renderBriefState } from './turn-schema';

/**
 * The check the plan deferred: does `cache_control` on `/api/intake` do anything?
 *
 * From the decisions taken before wave 1: "`cache_control` stays on
 * `/api/intake`, comes off `/api/extract`. Verify with
 * `usage.cache_read_input_tokens` on Sunday, not during the build." Sunday is
 * wave 6, and this is that verification. It had never been run: everything up
 * to now rests on `system-prompt.test.ts`, which estimates the prompt's size at
 * four characters per token and says so in its own comment ("the real check is
 * `usage.cache_read_input_tokens` against a live call").
 *
 * Why an estimate is not enough. A cache breakpoint below the model's minimum
 * cacheable prefix does not error, does not warn, and does not appear anywhere
 * in the response: it is silently ignored, and every turn is billed at the full
 * input rate. The floor is per model and is not monotonic across generations,
 * so it cannot be reasoned about from the model's age either. A
 * characters-per-token estimate sitting 20% above the floor is exactly the
 * situation where the answer is unknowable without asking.
 *
 * Two calls sharing the cached prefix. The first writes the cache, the second
 * must read it. The user turn differs between them on purpose: the brief and
 * the client's message ride after the breakpoint (see `buildMessages` in the
 * route), so a changing tail proves the prefix is what is being reused rather
 * than the whole request happening to be identical.
 *
 * Live, so it is opt-in: `INTAKE_LIVE_TESTS=1 pnpm test`. Two Sonnet turns.
 */

const LIVE = process.env.INTAKE_LIVE_TESTS === '1';

function turn(message: string) {
  const brief = createBrief('contract', fieldsForMatter('contract'));
  return {
    model: CONVERSATION_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text' as const,
        text: INTAKE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [
      {
        role: 'user' as const,
        content: `${renderBriefState(brief)}\n\nCLIENT MESSAGE\n${message}`,
      },
    ],
    output_config: {
      effort: 'low' as const,
      format: { type: 'json_schema' as const, schema: INTAKE_TURN_SCHEMA },
    },
  };
}

describe.runIf(LIVE)('the intake system prompt is actually cached', () => {
  it(
    'writes the cache on the first turn and reads it on the second',
    async () => {
      const anthropic = new Anthropic();

      const first = await anthropic.messages.create(turn('I need some help.'));
      // Same cached prefix, different tail: the brief and the message sit after
      // the breakpoint, so this is a genuine second turn rather than a repeat.
      const second = await anthropic.messages.create(
        turn('We signed an MSA with Acme and we want out early.'),
      );

      const write = first.usage.cache_creation_input_tokens ?? 0;
      const read = second.usage.cache_read_input_tokens ?? 0;

      console.log(
        `prompt cache (${CONVERSATION_MODEL}): turn 1 wrote ${write} tokens, ` +
          `turn 2 read ${read}; turn 2 uncached input ${second.usage.input_tokens}`,
      );

      /*
       * The assertion the whole thing exists for. Zero here means the
       * breakpoint is being ignored, which means the prompt is under this
       * model's floor and every turn in the flow is billed at full input rate.
       * It is the one failure in this codebase that is invisible from the
       * outside: the product behaves identically and only the bill changes.
       */
      expect(read).toBeGreaterThan(0);

      // And it is the prompt being cached, not some trivial prefix. The prompt
      // is ~2k tokens; anything much smaller would mean the breakpoint landed
      // somewhere unintended.
      expect(read).toBeGreaterThan(1024);

      /*
       * The prefix is reused rather than re-sent. `input_tokens` counts only
       * what was NOT served from cache, so on the second turn it should be the
       * brief and the message, which is far smaller than the prompt.
       */
      expect(second.usage.input_tokens).toBeLessThan(read);
    },
    5 * 60 * 1000,
  );
});
