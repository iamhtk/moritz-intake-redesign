import { cookies } from 'next/headers';
import {
  createGateToken,
  GATE_COOKIE,
  GATE_COOKIE_MAX_AGE,
  verifyPassword,
} from '@/lib/playground/gate';

// Playground-only password gate. The password and signing secret come from the
// environment and are verified server-side, so nothing ships in the client
// bundle. On success we set an httpOnly cookie holding a signed, expiring token
// (see lib/playground/gate) that the middleware and locale layout verify.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { password?: unknown };

// Best-effort in-memory rate limit. There is no shared store in the playground,
// so this is per-instance — adequate to blunt brute-force against the gate.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS;
}

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request): Promise<Response> {
  if (isRateLimited(clientKey(request))) {
    return Response.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!(await verifyPassword(body.password))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, await createGateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
}

// Lock the playground again by clearing the unlock cookie; the locale layout
// then re-renders the password screen on refresh.
export async function DELETE(): Promise<Response> {
  const cookieStore = await cookies();
  cookieStore.delete(GATE_COOKIE);
  return Response.json({ ok: true });
}
