/**
 * Browser sign-in for the AnalyzeIt desktop app and CLI (loopback + PKCE).
 * The native app opens /native-login with a port, a state and a PKCE challenge; after the user
 * approves, the backend returns a redirect to http://127.0.0.1:<port>/callback and we send the
 * browser there. These helpers keep the page from ever being used to send a code anywhere else.
 */

const B64URL = /^[A-Za-z0-9_-]+$/;

/** @returns {{port:number,state:string,challenge:string,client:'desktop'|'cli'|'plugin'} | null} */
export function parseNativeParams(search) {
  const p = new URLSearchParams(search);
  const portRaw = p.get('port') || '';
  const state = p.get('state') || '';
  const challenge = p.get('challenge') || '';
  const client = ['cli', 'desktop', 'plugin'].includes(p.get('client')) ? p.get('client') : null;
  if (!/^\d{4,5}$/.test(portRaw)) return null;
  const port = Number(portRaw);
  if (port < 1024 || port > 65535) return null;
  if (state.length < 16 || state.length > 128 || !B64URL.test(state)) return null;
  if (challenge.length !== 43 || !B64URL.test(challenge)) return null;
  if (!client) return null;
  return { port, state, challenge, client };
}

/** The only place this page may navigate to after approval: the app's own loopback listener. */
export function isSafeCallback(redirect, port, state) {
  if (typeof redirect !== 'string') return false;
  let u;
  try {
    u = new URL(redirect);
  } catch {
    return false;
  }
  return (
    u.protocol === 'http:' &&
    u.hostname === '127.0.0.1' &&
    u.port === String(port) &&
    u.pathname === '/callback' &&
    !u.username &&
    !u.password &&
    u.searchParams.get('state') === state &&
    Boolean(u.searchParams.get('code'))
  );
}

export function nativeLoginPath(search) {
  return `/native-login${search.startsWith('?') ? search : `?${search}`}`;
}

export function clientLabel(client) {
  if (client === 'plugin') return 'the AnalyzeIt plugin for Claude';
  return client === 'cli' ? 'the AnalyzeIt command line' : 'AnalyzeIt for desktop';
}
