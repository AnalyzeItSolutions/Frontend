/**
 * Helpers for the page where a person reviews what an AI assistant asked for: access to data ("ar_..."), or a change
 * to records (an action id plus its project). Anything that does not look right is rejected before a request is made.
 */

const ACCESS_ID = /^ar_[A-Za-z0-9_-]{20,40}$/;
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** @returns {{kind:'access', id:string} | {kind:'change', id:string, project:string} | null} */
export function parseApproval(search) {
  const p = new URLSearchParams(search);
  const access = p.get('request');
  if (access) return ACCESS_ID.test(access) ? { kind: 'access', id: access } : null;
  const change = p.get('change');
  const project = p.get('project');
  if (change && project && SAFE_ID.test(change) && /^[A-Za-z0-9_.-]{1,128}$/.test(project)) return { kind: 'change', id: change, project };
  return null;
}

export function approvalPath(a) {
  return a.kind === 'access' ? `/approve?request=${encodeURIComponent(a.id)}` : `/approve?change=${encodeURIComponent(a.id)}&project=${encodeURIComponent(a.project)}`;
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** One line describing what Allow would do. */
export function accessHeadline(client, selectedCount, wholeProject) {
  if (wholeProject) return `Let ${client} read everything in this project, including tables you add later`;
  return selectedCount ? `Let ${client} read ${plural(selectedCount, 'table')}` : 'Choose at least one table';
}

export function explainAccessError(status, message) {
  if (status === 401) return 'Your session has expired. Sign in again.';
  if (status === 404) return 'This request was not found. It may have expired, or it belongs to another account.';
  if (status === 409) return 'This request was already answered or has expired.';
  return typeof message === 'string' && message ? message : 'Something went wrong. Please try again.';
}
