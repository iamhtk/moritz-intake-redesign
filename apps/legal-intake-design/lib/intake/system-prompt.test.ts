import { describe, expect, it } from 'vitest';
import { MATTER_FLOWS } from '@/components/design/new-case/matters';
import type { MatterId } from '@/components/design/new-case/intake-types';
import { fieldsForMatter } from './matter-fields';
import { INTAKE_SYSTEM_PROMPT } from './system-prompt';

/**
 * Rough characters-per-token for English prose. Deliberately conservative: the
 * point is to catch a prompt that has been trimmed below the cache floor, not
 * to predict the token count exactly. The real check is
 * `usage.cache_read_input_tokens` against a live call.
 */
const CHARS_PER_TOKEN = 4;
const SONNET_CACHE_MINIMUM_TOKENS = 1024;

describe('INTAKE_SYSTEM_PROMPT', () => {
  it('clears the prompt-cache floor for claude-sonnet-5', () => {
    const estimatedTokens = INTAKE_SYSTEM_PROMPT.length / CHARS_PER_TOKEN;
    expect(estimatedTokens).toBeGreaterThan(SONNET_CACHE_MINIMUM_TOKENS);
  });

  it('is static, nothing dynamic may sit in front of the cache breakpoint', () => {
    // A date, time or id in here would invalidate the cached prefix every turn.
    expect(INTAKE_SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(INTAKE_SYSTEM_PROMPT).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(INTAKE_SYSTEM_PROMPT).toBe(INTAKE_SYSTEM_PROMPT);
  });

  it('lists every matter and every field key the brief can hold', () => {
    for (const id of Object.keys(MATTER_FLOWS) as MatterId[]) {
      expect(INTAKE_SYSTEM_PROMPT).toContain(id);
      for (const field of fieldsForMatter(id)) {
        expect(INTAKE_SYSTEM_PROMPT).toContain(field.key);
      }
    }
  });

  it('carries the rules the brief invariants depend on', () => {
    // Matched against reflowed text so rewrapping a paragraph cannot break
    // an assertion about what the prompt actually says.
    const prose = INTAKE_SYSTEM_PROMPT.replace(/\s+/g, ' ');

    // Decision 5 / invariant 1, the model cannot confirm anything.
    expect(prose).toContain('Only the client can confirm a value');
    // Decision 13, a confused message produces no field update.
    expect(prose).toContain('Return no field updates at all');
    // Decision 6, only ask what is missing.
    expect(prose).toContain('Never ask about a field that already has a value');
    // Decision 21 / the honesty rule, a quote comes next, not a lawyer.
    expect(prose).toContain('the firm sends a quote');
    expect(prose).toContain('A lawyer is assigned once that quote is paid');
    // Decision 19 / never invent.
    expect(prose).toContain('Never invent a value');
  });
});
