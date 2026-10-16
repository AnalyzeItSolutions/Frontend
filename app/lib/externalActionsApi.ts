import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';
import type { ActionField } from './externalActions.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/v1`;

export type ExternalActionStatus = 'pending' | 'running' | 'done' | 'failed' | 'denied' | 'cancelled' | 'expired';

export interface ExternalAction {
  id: string;
  status: ExternalActionStatus;
  action: string;
  title: string;
  risk: 'low' | 'medium' | 'high';
  provider: string;
  provider_name: string;
  account: { id: string; label: string } | null;
  summary: string;
  params: Record<string, string | number>;
  fields: ActionField[];
  /** Approval is bound to this hash of the exact content the person is looking at. */
  params_sha256: string;
  edited: boolean;
  expires_at: string;
  result: { summary?: string; detail?: Record<string, unknown> } | null;
  error: string | null;
  error_code: string | null;
  has_file: boolean;
}

export interface ProviderField {
  name: string;
  label: string;
  secret: boolean;
  help: string;
  choices: string[];
}

export interface ProviderSpec {
  id: string;
  name: string;
  note: string;
  actions: string[];
  fields: ProviderField[];
}

export interface ExternalAccount {
  id: string;
  provider: string;
  provider_name: string;
  label: string;
  public: Record<string, string>;
  created_at: string;
  last_used_at: string | null;
}

const json = { 'Content-Type': 'application/json' };

export async function listProviders(): Promise<ProviderSpec[]> {
  const res = await fetch(`${API_V1}/external/providers`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load the list of services');
  return (await res.json()).providers;
}

export async function listAccounts(): Promise<ExternalAccount[]> {
  const res = await fetch(`${API_V1}/external/accounts`, { headers: { ...getAuthHeaders() }, cache: 'no-store' });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load your accounts');
  return (await res.json()).accounts;
}

/** The only call that carries a login. It goes straight to the API: not through the chat, not into state, not into storage. */
export async function connectAccount(provider: string, label: string, fields: Record<string, string>): Promise<ExternalAccount> {
  const res = await fetch(`${API_V1}/external/accounts`, {
    method: 'POST',
    headers: { ...json, ...getAuthHeaders() },
    body: JSON.stringify({ provider, label, fields }),
    cache: 'no-store',
    credentials: 'omit',
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save the account');
  return res.json();
}

export async function removeAccount(id: string): Promise<void> {
  const res = await fetch(`${API_V1}/external/accounts/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not remove the account');
}

export async function getExternalAction(id: string): Promise<ExternalAction> {
  const res = await fetch(`${API_V1}/external-actions/${encodeURIComponent(id)}`, { headers: { ...getAuthHeaders() }, cache: 'no-store' });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load this request');
  return res.json();
}

/** Save an edit. The server returns the action with a new hash; approving needs that new hash. */
export async function editExternalAction(id: string, params: Record<string, unknown>, baseSha256: string): Promise<ExternalAction> {
  const res = await fetch(`${API_V1}/external-actions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...json, ...getAuthHeaders() },
    body: JSON.stringify({ params, base_sha256: baseSha256 }),
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save your changes');
  return res.json();
}

export async function decideExternalAction(id: string, decision: 'approve' | 'deny', baseSha256: string): Promise<ExternalAction> {
  const res = await fetch(`${API_V1}/external-actions/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    headers: { ...json, ...getAuthHeaders() },
    body: JSON.stringify({ decision, base_sha256: baseSha256 }),
  });
  if (!res.ok) throw await apiErrorFrom(res, decision === 'approve' ? 'Could not run this' : 'Could not deny this');
  return res.json();
}

/** Downloads need the sign-in header, so the file is fetched and saved from here rather than linked. */
export async function saveActionFile(id: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${API_V1}/external-actions/${encodeURIComponent(id)}/file`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'The file is no longer available');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
