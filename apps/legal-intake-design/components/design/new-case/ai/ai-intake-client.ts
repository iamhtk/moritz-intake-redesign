/**
 * Thin client wrappers around the `/api/ai-intake` proxy. Both return `null` on
 * any error, non-200, abort, or unavailable key so callers fall back to the
 * deterministic script. The shared Claude key stays server-side.
 */

import type {
  AiRecapRequest,
  AiRecapResult,
  AiTurnRequest,
  AiTurnResult,
} from './types';

const ENDPOINT = '/api/ai-intake';

export async function aiTurn(
  req: AiTurnRequest,
  signal?: AbortSignal,
): Promise<AiTurnResult | null> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'turn', ...req }),
      signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      ok?: boolean;
      result?: AiTurnResult;
    };
    return data?.ok && data.result ? data.result : null;
  } catch {
    return null;
  }
}

export async function aiRecap(
  req: AiRecapRequest,
  signal?: AbortSignal,
): Promise<AiRecapResult | null> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'recap', ...req }),
      signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      ok?: boolean;
      result?: AiRecapResult;
    };
    return data?.ok && data.result ? data.result : null;
  } catch {
    return null;
  }
}
