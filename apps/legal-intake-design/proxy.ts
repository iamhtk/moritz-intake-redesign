import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { GATE_COOKIE, verifyGateToken } from './lib/playground/gate';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes render outside the locale layout, so the layout's password gate
  // does not protect them. Enforce the gate here instead: /api/gate stays open
  // (it issues the unlock cookie); everything else under /api requires a valid
  // signed token, or it gets a 401 before any handler runs.
  if (pathname.startsWith('/api')) {
    if (pathname === '/api/gate') {
      return NextResponse.next();
    }
    const unlocked = await verifyGateToken(
      request.cookies.get(GATE_COOKIE)?.value,
    );
    if (!unlocked) {
      return NextResponse.json({ ok: false, error: 'locked' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Pages: next-intl handles locale routing. Locked users still reach the app
  // shell so the locale layout can render the password screen.
  return intlMiddleware(request);
}

export const config = {
  // Run on everything except Next internals, fonts, and files with an
  // extension. API routes are now included so the gate above can protect them.
  matcher: '/((?!_next|fonts|.*\\..*).*)',
};
