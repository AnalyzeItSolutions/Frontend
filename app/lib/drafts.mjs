/** Pure helpers for the Drafts page: platforms, limits, status wording and the rules for what may be approved or sent. */

export const PLATFORMS = [
  { id: 'x', label: 'X', limit: 280, site: 'https://x.com/compose/post' },
  { id: 'bluesky', label: 'Bluesky', limit: 300, site: 'https://bsky.app/' },
  { id: 'threads', label: 'Threads', limit: 500, site: 'https://www.threads.net/' },
  { id: 'linkedin', label: 'LinkedIn', limit: 3000, site: 'https://www.linkedin.com/feed/' },
  { id: 'reddit', label: 'Reddit', limit: 40000, site: 'https://www.reddit.com/submit' },
];

/** Set when the extension has a store listing. Until then the page says so plainly instead of linking nowhere. */
export const EXTENSION_STORE_URL = null;

export function platform(id) {
  return PLATFORMS.find((p) => p.id === id) || null;
}

export function charsLeft(platformId, text) {
  const p = platform(platformId);
  return p ? p.limit - (text || '').length : 0;
}

export function statusLabel(status) {
  return { draft: 'Draft', approved: 'Approved', sent: 'Posted', cancelled: 'Cancelled' }[status] || status;
}

/** Approval is for the text exactly as saved; unsaved or invalid text can not be approved. */
export function canApprove(draft, editedText) {
  if (!draft || draft.status === 'sent' || draft.status === 'cancelled') return false;
  if (draft.status === 'approved') return false;
  if ((editedText ?? draft.text) !== draft.text) return false;
  return draft.text.trim().length > 0 && charsLeft(draft.platform, draft.text) >= 0;
}

export function isDirty(draft, editedText) {
  return editedText !== undefined && editedText !== draft.text;
}

/** What to show when an approved draft is handed to the extension. */
export function fillMessage(outcome) {
  if (!outcome) return '';
  if (outcome.ok) return 'Filled in your post box. Check it, press Post yourself, then mark it as posted here.';
  return outcome.reason || 'The extension did not fill it.';
}

export function extensionLabel(state) {
  if (!state || !state.connected) return 'Not connected';
  return `Connected${state.version ? ` · v${state.version}` : ''}`;
}

/** Can the extension take this platform right now? Returns a reason when not. */
export function extensionBlock(state, platformId) {
  if (!state?.connected) return 'The extension is not connected.';
  const p = state.platforms?.[platformId];
  if (!p) return 'The extension does not support this site.';
  if (state.paused || p.paused) return 'Paused in the extension.';
  if (!p.allowed) return `Allow ${p.label} in the extension first (its toolbar icon).`;
  if (p.used >= p.cap) return `Daily limit reached for ${p.label} (${p.cap}).`;
  return null;
}
