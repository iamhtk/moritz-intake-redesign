// Playground-only password gate primitives, shared by the middleware (edge),
// the /api/gate route (node), and the locale layout (node).
//
// The unlock cookie holds a signed, expiring token instead of a static value,
// so it cannot be forged by simply setting `pg_unlocked=1` in the browser. The
// password and signing secret come from the environment, never source. All
// crypto uses the Web Crypto API (`crypto.subtle`) + `btoa` so the module runs
// unchanged in both the edge and node runtimes.

export const GATE_COOKIE = 'pg_unlocked';

// 30-day unlock, expressed both in ms (baked into the token) and seconds (for
// the cookie's max-age) so the two never drift apart.
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const GATE_COOKIE_MAX_AGE = TOKEN_TTL_MS / 1000;

const TOKEN_VERSION = 'v1';
const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.PLAYGROUND_GATE_SECRET;
  if (!secret) {
    throw new Error('PLAYGROUND_GATE_SECRET is not configured');
  }
  return secret;
}

function getPassword(): string {
  const password = process.env.PLAYGROUND_PASSWORD;
  if (!password) {
    throw new Error('PLAYGROUND_PASSWORD is not configured');
  }
  return password;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

// Length-independent constant-time string comparison.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Mints a signed token of the form `v1.<expiresAtMs>.<hmac(payload)>`.
export async function createGateToken(): Promise<string> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${await hmac(payload)}`;
}

// Verifies signature (constant-time) and expiry. Never throws for malformed or
// missing tokens so callers can treat "unverifiable" as simply "locked"; a
// missing secret still throws (fail closed on misconfiguration).
export async function verifyGateToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = await hmac(payload);
  if (!timingSafeEqual(signature, expected)) return false;

  const [version, expiresAtRaw] = payload.split('.');
  if (version !== TOKEN_VERSION) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

// Constant-time password check. Both sides are HMAC'd first so neither the
// length nor the content of the configured password leaks via timing.
export async function verifyPassword(candidate: unknown): Promise<boolean> {
  if (typeof candidate !== 'string') return false;
  const [candidateHash, expectedHash] = await Promise.all([
    hmac(candidate),
    hmac(getPassword()),
  ]);
  return timingSafeEqual(candidateHash, expectedHash);
}
