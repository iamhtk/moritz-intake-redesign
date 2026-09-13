import { afterEach, describe, expect, it, vi } from 'vitest';
import { missingKeyResponse } from './failure-server';
import { failureKindOfResponse, isRetryable } from './failure';

afterEach(() => vi.unstubAllEnvs());

describe('the missing-key guard', () => {
  it('is silent when a key is present', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    expect(missingKeyResponse('intake')).toBeNull();
  });

  it('answers unauthorized when there is none', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const response = missingKeyResponse('intake');
    expect(response).not.toBeNull();
    expect(await failureKindOfResponse(response!)).toBe('unauthorized');
  });

  it('does not invite a retry that cannot succeed', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const kind = await failureKindOfResponse(missingKeyResponse('intake')!);
    expect(isRetryable(kind)).toBe(false);
  });
});
