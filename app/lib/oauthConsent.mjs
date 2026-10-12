/**
 * Helpers for the page where a user approves an AI assistant's connection (OAuth consent).
 * The page only ever navigates to the address the API returns after a decision, and only if it is the host
 * it told the user about, over https (or loopback http for apps running on this computer).
 */

const REQUEST_ID = /^req_[A-Za-z0-9_-]{20,80}$/;

/** @returns {string|null} the request id from a query string, or null if it is not well formed. */
export function parseRequestId(search) {
  const id = new URLSearchParams(search).get('request') || '';
  return REQUEST_ID.test(id) ? id : null;
}

export function consentPath(requestId) {
  return `/oauth/consent?request=${encodeURIComponent(requestId)}`;
}

/** True when `redirect` is safe to navigate to: https (or http on loopback), no credentials, and the host the user was shown. */
export function isSafeRedirect(redirect, expectedHost) {
  if (typeof redirect !== 'string' || typeof expectedHost !== 'string' || !expectedHost) return false;
  let u;
  try {
    u = new URL(redirect);
  } catch {
    return false;
  }
  if (u.username || u.password || u.hash) return false;
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname);
  if (!(u.protocol === 'https:' || (u.protocol === 'http:' && loopback))) return false;
  return u.host === expectedHost;
}

/** "3 hours ago" style text for the connected-apps list. */
export function lastUsed(ts, now = Date.now() / 1000) {
  if (!ts) return 'Not used yet';
  const d = Math.max(0, now - ts);
  if (d < 60) return 'Used just now';
  if (d < 3600) return `Used ${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `Used ${Math.floor(d / 3600)} h ago`;
  return `Used ${Math.floor(d / 86400)} d ago`;
}
