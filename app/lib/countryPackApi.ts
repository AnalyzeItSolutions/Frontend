import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export interface Country {
  iso3: string;
  name: string;
  region: string;
}

export interface MetricRule {
  id: string;
  widget_id: string;
  label: string;
  op: 'gt' | 'lt' | 'up_pct' | 'down_pct';
  threshold: number;
  severity: 'high' | 'medium';
  enabled: boolean;
  meaning?: string;
  last_value?: number | null;
  last_state?: 'ok' | 'breached' | null;
}

export interface PackResult {
  kind?: string;
  name?: string;
  country: string;
  iso3: string;
  widgets: number;
  layout_version: number;
  rules: MetricRule[];
  alerts: Array<{ id: string; title: string; severity: string }>;
  missing: string[];
  dropped: number;
  news_error: string;
}

export async function listCountries(): Promise<Country[]> {
  const res = await fetch(`${API_V1}/public/countries`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load the country list');
  return res.json();
}

export async function buildCountryPack(projectId: string, iso3: string): Promise<PackResult> {
  const res = await fetch(`${API_V1}/projects/${projectId}/packs/country`, { method: 'POST', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify({ country: iso3 }) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not build the dashboard');
  return res.json();
}

export async function refreshPublicData(projectId: string): Promise<{ refreshed: number; failed: number; alerts: unknown[] }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/packs/refresh`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not refresh the data');
  return res.json();
}

export async function listMetricRules(projectId: string): Promise<MetricRule[]> {
  const res = await fetch(`${API_V1}/projects/${projectId}/metric-rules`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load alert rules');
  return res.json();
}

export async function createMetricRule(projectId: string, body: Partial<MetricRule>): Promise<MetricRule> {
  const res = await fetch(`${API_V1}/projects/${projectId}/metric-rules`, { method: 'POST', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not add the alert');
  return res.json();
}

export async function updateMetricRule(projectId: string, id: string, body: Partial<MetricRule>): Promise<MetricRule> {
  const res = await fetch(`${API_V1}/projects/${projectId}/metric-rules/${id}`, { method: 'PATCH', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save the alert');
  return res.json();
}

export async function deleteMetricRule(projectId: string, id: string): Promise<void> {
  const res = await fetch(`${API_V1}/projects/${projectId}/metric-rules/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not remove the alert');
}

export type TrackKind = 'country' | 'market' | 'place' | 'topic';

export interface Trackable {
  kind: TrackKind;
  ref: string;
  name: string;
  subtitle: string;
}

/** What a few typed letters could mean: a country, a company or other market, a place, or any topic. */
export async function searchTrackables(q: string, signal?: AbortSignal): Promise<Trackable[]> {
  const res = await fetch(`${API_V1}/trackers/search?q=${encodeURIComponent(q)}`, { headers: { ...getAuthHeaders() }, signal });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not search');
  return res.json();
}

export async function buildTracker(projectId: string, item: Pick<Trackable, 'kind' | 'ref' | 'name'>): Promise<PackResult> {
  const res = await fetch(`${API_V1}/projects/${projectId}/packs/track`, { method: 'POST', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(item) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not build the dashboard');
  return res.json();
}
