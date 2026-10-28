// Pure helpers for actions the assistant proposes on the person's own accounts (post, follow, message, add a task, download),
// alone or as a task plan of several steps approved once.
// No React, so they are unit-tested with `node --test`.

const RISK = {
  low: 'Low impact',
  medium: 'Visible to others',
  high: 'Can change things',
};

export function riskLabel(risk) {
  return RISK[risk] || RISK.medium;
}

const FINAL = ['done', 'failed', 'denied', 'cancelled', 'expired'];

export function isFinal(status) {
  return FINAL.includes(status);
}

export function statusText(status) {
  switch (status) {
    case 'pending': return 'Waiting for your approval';
    case 'running': return 'Working on it…';
    case 'done': return 'Done';
    case 'failed': return 'Did not go through';
    case 'denied': return 'Denied. Nothing was sent.';
    case 'cancelled': return 'Cancelled. Nothing was sent.';
    case 'expired': return 'Expired. Nothing was sent. Ask again if you still want it.';
    default: return status || '';
  }
}

const PLAN_FINAL = ['done', 'failed', 'denied', 'cancelled', 'expired'];

export function isPlanFinal(status) {
  return PLAN_FINAL.includes(status);
}

export function planStatusText(status, steps) {
  const list = steps || [];
  const done = list.filter((s) => s.status === 'done').length;
  switch (status) {
    case 'pending': return `Waiting for your approval (${list.length} steps)`;
    case 'running': return `Working on it… ${done} of ${list.length} done`;
    case 'done': return `All ${list.length} steps done`;
    case 'failed': {
      const bad = list.find((s) => s.status === 'failed');
      return bad ? `Stopped at step ${bad.n}. ${done} of ${list.length} done; later steps were not sent.` : 'Stopped. Later steps were not sent.';
    }
    default: return statusText(status);
  }
}

export function stepStatusText(status) {
  if (status === 'skipped') return 'Not run';
  if (status === 'pending') return 'Waiting';
  return statusText(status);
}

/** The highest risk among the steps decides the plan's label. */
export function planRisk(steps) {
  const r = (steps || []).map((s) => s.risk);
  return r.includes('high') ? 'high' : r.includes('medium') ? 'medium' : 'low';
}

/** Split text around {{step N.key}} so the card can show where an earlier step's result goes. */
export function splitStepRefs(text) {
  const s = String(text ?? '');
  const out = [];
  const re = /\{\{\s*step\s*(\d)\s*\.\s*([a-z_]{1,20})\s*\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ ref: { step: Number(m[1]), key: m[2] }, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

/** Form state for the editor: every field as a string. */
export function draftFromParams(fields, params) {
  const out = {};
  for (const f of fields || []) {
    const v = params?.[f.name];
    out[f.name] = v === undefined || v === null ? '' : typeof v === 'string' ? v : String(v);
  }
  return out;
}

/** Back to the parameters the server expects: numbers as numbers, empty optional fields left out. */
export function paramsFromDraft(fields, draft) {
  const out = {};
  for (const f of fields || []) {
    const raw = draft?.[f.name] ?? '';
    if (!String(raw).trim()) {
      if (f.required) out[f.name] = '';
      continue;
    }
    out[f.name] = f.kind === 'int' ? Number(raw) : raw;
  }
  return out;
}

export function sameParams(fields, a, b) {
  return (fields || []).every((f) => String(a?.[f.name] ?? '') === String(b?.[f.name] ?? ''));
}

/** Problems the person can fix before saving an edit (the server checks again). */
export function draftProblems(fields, draft) {
  const problems = {};
  for (const f of fields || []) {
    const v = String(draft?.[f.name] ?? '');
    if (f.required && !v.trim()) problems[f.name] = `${f.label} is required.`;
    else if (v.length > f.max_len) problems[f.name] = `${v.length} of ${f.max_len} characters.`;
    else if (f.kind === 'int' && v.trim() && !/^\d{1,12}$/.test(v.trim())) problems[f.name] = 'Use a number.';
  }
  return problems;
}

/** A link from a result is only shown if it is plain https. */
export function safeLink(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

const SECRET_SHAPES = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}/,
  /\bxox[abpr]-[A-Za-z0-9-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/,
  /\b\d{6,15}:[A-Za-z0-9_-]{30,}\b/,
  /https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/,
  /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:password|passwd|pwd|passcode|api[ _-]?key|secret|token)\s*(?:is|=|:)\s*\S{6,}/i,
  /\bbearer\s+[A-Za-z0-9._~+/=-]{20,}/i,
];

/** True when a message looks like it contains a login or key. Such a message is not sent to the assistant. */
export function looksLikeSecret(text) {
  const s = String(text || '');
  return SECRET_SHAPES.some((re) => re.test(s));
}

export const SECRET_WARNING =
  'That looks like a password, key or token. It was not sent. Use “Connect account” (the plug button) instead: it stores the login encrypted and the AI never sees it.';

/** Describe an error from the actions API for the card. */
export function explainActionError(status, message) {
  if (status === 409) return message || 'This request changed since you opened it. Review it again.';
  if (status === 429) return 'Too many requests right now. Try again in a minute.';
  if (status === 404) return 'This request is no longer available.';
  if (status === 401) return 'Sign in again to continue.';
  return message || 'Something went wrong. Nothing was sent.';
}
