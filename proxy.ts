import { NextResponse, type NextRequest } from 'next/server';
import { COUNTRY_COOKIE, normalizeCountry } from './app/lib/countryProfile.mjs';
import { isBlockedBot } from './app/lib/botPolicy.mjs';
import { AUTH_COOKIE, SESSION_COOKIE, decideHostRequest, publicHost } from './app/lib/personalHost.mjs';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/research', // signed-out visitors are sent to sign in at once (no "Checking account…" flash); /demo is the public way to try it
  '/globe',
  '/connectors',
  '/objects',
  '/profile',
  '/billing',
  '/new-project',
  '/project',
  '/ops',
  '/memory',
  '/embeddings',
  '/onboarding',
  '/digest',
];

// UI gate only: the API enforces real auth on every call. The AUTH_COOKIE flag is client-set,
// so never treat this as a security boundary.
function hasSession(request: NextRequest): boolean {
  if (request.cookies.get(AUTH_COOKIE)?.value === '1') return true;
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
}

// Paths the host, sign-in and country logic below runs on; every other path only gets the bot check.
const ROUTED = /^\/(?:$|products$|login(?:\/|$)|auth(?:\/|$)|dashboard(?:\/|$)|digest(?:\/|$)|research(?:\/|$)|globe(?:\/|$)|connectors(?:\/|$)|objects(?:\/|$)|profile(?:\/|$)|billing(?:\/|$)|new-project(?:\/|$)|project(?:\/|$)|ops(?:\/|$)|memory(?:\/|$)|embeddings(?:\/|$)|onboarding(?:\/|$))/i;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname !== '/robots.txt' && isBlockedBot(request.headers.get('user-agent'))) {
    return new NextResponse('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }
  if (!ROUTED.test(pathname)) return NextResponse.next();
  const hostHeader = publicHost(request.headers.get('host'), request.headers.get('x-forwarded-host'));
  const decision = decideHostRequest({
    hostHeader,
    pathname,
    search,
    protocol: request.nextUrl.protocol,
    sessionCookie: request.cookies.get(SESSION_COOKIE)?.value || '',
  });

  if (decision.action === 'redirect' && decision.url) {
    return NextResponse.redirect(decision.url, decision.status);
  }

  if (decision.action === 'rewrite' && decision.slug) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.set('slug', decision.slug);
    return NextResponse.rewrite(url);
  }

  // Case-sensitive legacy path only — avoids Vercel next.config case-insensitive loop.
  if (pathname === '/Dashboard' || pathname.startsWith('/Dashboard/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/Dashboard/, '/dashboard');
    return NextResponse.redirect(url);
  }

  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) ||
      pathname.toLowerCase() === prefix.toLowerCase() ||
      pathname.toLowerCase().startsWith(`${prefix.toLowerCase()}/`),
  );

  if (needsAuth && !hasSession(request)) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  // Visitor country from the edge, for marketing copy and price notes only. Public and not a security signal.
  const country = normalizeCountry(request.headers.get('x-vercel-ip-country'));
  if (country && request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    response.cookies.set(COUNTRY_COOKIE, country, { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/products',
    '/digest/:path*',
    '/digest',
    '/login',
    '/login/:path*',
    '/auth/:path*',
    '/research/:path*',
    '/research',
    '/dashboard/:path*',
    '/dashboard',
    '/Dashboard/:path*',
    '/Dashboard',
    '/globe/:path*',
    '/globe',
    '/connectors/:path*',
    '/connectors',
    '/objects/:path*',
    '/objects',
    '/profile/:path*',
    '/profile',
    '/billing/:path*',
    '/billing',
    '/new-project/:path*',
    '/new-project',
    '/project/:path*',
    '/project',
    '/ops/:path*',
    '/ops',
    '/memory/:path*',
    '/memory',
    '/embeddings/:path*',
    '/embeddings',
    '/onboarding/:path*',
    '/onboarding',
    // Everything else, for the bot check only (static build files excluded).
    '/((?!_next/static|_next/image).*)',
  ],
};
