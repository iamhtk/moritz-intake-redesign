/**
 * Dev-only Anthropic usage logging. Never logs the API key.
 */

export type AnthropicUsageLike = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export function logAnthropicUsage(
  label: string,
  usage: AnthropicUsageLike | null | undefined,
): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (!usage) return;

  console.log(`[anthropic:${label}] usage`, {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
  });
}
