/**
 * Personal dashboard hosts: yourname.analyzeit.si (yourname.analyzeit.in still accepted)
 *
 * The bearer token lives in localStorage, which the browser does not share
 * across subdomains. Middleware therefore sends a personal host to
 * www.analyzeit.si/auth/subdomain, which copies the www session into a
 * parent-domain cookie and sends the browser back. The boot script hydrates
 * localStorage on the personal host before the app calls the API.
 */

export const AUTH_COOKIE = 'analyzeit_auth';
export const SESSION_COOKIE = 'analyzeit_session';
export const TOKEN_STORAGE_KEY = 'analyzeit_token';

export const PRIMARY_DOMAIN = 'analyzeit.si';
export const LEGACY_DOMAIN = 'analyzeit.in';
const DOMAINS = [PRIMARY_DOMAIN, LEGACY_DOMAIN];

/** The product apex ('analyzeit.si' or the legacy one) a hostname belongs to, else null. */
export function appDomainOf(hostname) {
  const h = String(hostname || '').split(':')[0].toLowerCase();
  return DOMAINS.find((d) => h === d || h.endsWith('.' + d)) || null;
}

const RESERVED = new Set(['www', 'app']);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

export function isValidPersonalSlug(slug) {
  if (typeof slug !== 'string') return false;
  if (slug !== slug.toLowerCase()) return false;
  if (!SLUG_RE.test(slug)) return false;
  if (RESERVED.has(slug)) return false;
  return true;
}

export function publicHost(hostHeader, forwardedHeader) {
  const host = String(hostHeader || '').split(',')[0].trim();
  const hostname = host.split(':')[0].toLowerCase();
  const forwarded = String(forwardedHeader || '').split(',')[0].trim();
  const forwardedName = forwarded.split(':')[0].toLowerCase();
  const internal = !hostname || hostname.endsWith('.vercel.app') || hostname.endsWith('.vercel.sh');
  const forwardedOk =
    appDomainOf(forwardedName) !== null ||
    forwardedName === 'localhost' ||
    forwardedName.endsWith('.localhost') ||
    forwardedName === '127.0.0.1';
  if (internal && forwarded && forwardedOk) return forwarded;
  return host;
}

export function extractPersonalSlug(hostHeader) {
  if (!hostHeader) return null;
  const host = String(hostHeader).split(':')[0].toLowerCase();
  if (!host || host.endsWith('.vercel.app') || host.endsWith('.vercel.sh')) return null;
  let label = null;
  if (host.endsWith('.localhost') && host !== 'localhost') {
    label = host.slice(0, -'.localhost'.length);
  } else {
    const d = DOMAINS.find((x) => host.endsWith('.' + x));
    if (d) label = host.slice(0, -('.' + d).length);
  }
  if (!label || label.includes('.')) return null;
  return isValidPersonalSlug(label) ? label : null;
}

export function canonicalAppOrigin({ protocol, hostHeader }) {
  const raw = String(hostHeader || '');
  const hostname = raw.split(':')[0].toLowerCase();
  const port = raw.includes(':') ? raw.slice(raw.lastIndexOf(':') + 1) : '';
  if (appDomainOf(hostname)) {
    return `https://www.${PRIMARY_DOMAIN}`;
  }
  const proto = protocol && String(protocol).endsWith(':') ? String(protocol) : `${protocol || 'http'}:`;
  return `${proto}//localhost${port ? `:${port}` : ''}`;
}

/**
 * Where middleware should send this request.
 * action: 'next' | 'redirect' | 'rewrite'
 */
export function decideHostRequest({ hostHeader, pathname, search = '', protocol = 'https:', sessionCookie = '' }) {
  const host = String(hostHeader || '').split(':')[0].toLowerCase();
  const path = pathname || '/';
  const query = search && !String(search).startsWith('?') ? `?${search}` : String(search || '');

  if (host === PRIMARY_DOMAIN || host === LEGACY_DOMAIN) {
    return { action: 'redirect', status: 308, url: `https://www.${PRIMARY_DOMAIN}${path}${query}` };
  }

  const slug = extractPersonalSlug(hostHeader);
  if (!slug) return { action: 'next' };

  const origin = canonicalAppOrigin({ protocol, hostHeader });
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const installing = params.get('handoff') === '1';
  const hasSession = Boolean(sessionCookie);

  if (!hasSession && !installing) {
    return {
      action: 'redirect',
      status: 307,
      url: `${origin}/auth/subdomain?slug=${encodeURIComponent(slug)}`,
    };
  }

  if (path === '/' || path === '/dashboard') {
    return { action: 'rewrite', slug };
  }

  return { action: 'redirect', status: 307, url: `${origin}${path}${query}` };
}

export function returnUrlForPersonalSlug(slug, loc, token) {
  if (!isValidPersonalSlug(slug)) return null;
  const hostname = String(loc?.hostname || '').toLowerCase();
  if (appDomainOf(hostname)) {
    return `https://${slug}.${PRIMARY_DOMAIN}/`;
  }
  const proto = loc?.protocol || 'http:';
  const port = loc?.port ? `:${loc.port}` : '';
  const hash = token ? `#session=${encodeURIComponent(token)}` : '';
  return `${proto}//${slug}.localhost${port}/?handoff=1${hash}`;
}

export function personalSlugAllowed(user) {
  if (!user || typeof user !== 'object') return null;
  const ents = user.entitlements;
  if (ents && typeof ents === 'object' && typeof ents.personal_dashboard_slug === 'boolean') {
    return ents.personal_dashboard_slug;
  }
  const tier = String(user.tier || '').toLowerCase();
  if (!tier) return null;
  return tier === 'premium' || tier === 'premium_plus';
}

export function classifySlugFailure(status, upgradeRequired) {
  if (upgradeRequired || status === 402) return 'upgrade';
  if (status === 404) return 'missing';
  if (status === 403) return 'denied';
  return 'error';
}

/** Inline head script: hydrate the bearer token and never wipe the parent cookie from a personal host. */
export function buildSessionBootScript() {
  return `try{
var host=location.hostname.toLowerCase();
var apex=['${PRIMARY_DOMAIN}','${LEGACY_DOMAIN}'].filter(function(d){return host===d||host.endsWith('.'+d);})[0]||'';
var onAnalyzeit=!!apex;
var personal=(onAnalyzeit&&host.split('.').length===3&&host.split('.')[0]!=='www'&&host.split('.')[0]!=='app')||(host.endsWith('.localhost')&&host!=='localhost');
function cookieVal(name){var m=document.cookie.match(new RegExp('(?:^|; )'+name+'=([^;]*)'));return m?decodeURIComponent(m[1]):'';}
var token='';
try{token=localStorage.getItem('${TOKEN_STORAGE_KEY}')||'';}catch(e){}
if(location.hash&&location.hash.indexOf('session=')!==-1){
  try{
    var hashed=new URLSearchParams(location.hash.replace(/^#/, '')).get('session')||'';
    if(hashed){localStorage.setItem('${TOKEN_STORAGE_KEY}', hashed);token=hashed;}
    var clean=new URL(location.href);clean.hash='';clean.searchParams.delete('handoff');
    history.replaceState(null,'',clean.pathname+clean.search);
  }catch(e){}
}
var session=cookieVal('${SESSION_COOKIE}');
if(!token&&session){try{localStorage.setItem('${TOKEN_STORAGE_KEY}', session);token=session;}catch(e){}}
var domain=onAnalyzeit?'; Domain=.'+apex:'';
var secure=location.protocol==='https:'?'; Secure':'';
if(token){
  document.cookie='${SESSION_COOKIE}='+encodeURIComponent(token)+'; Path=/; SameSite=Lax; Max-Age=2592000'+domain+secure;
  document.cookie='${AUTH_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=2592000'+domain+secure;
}else if(!personal){
  document.cookie='${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0'+domain+secure;
  document.cookie='${AUTH_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0'+domain+secure;
}
var t=localStorage.getItem('analyzeit-theme');
if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}
}catch(e){}`;
}
