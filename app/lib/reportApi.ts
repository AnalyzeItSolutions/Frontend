import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export interface ReportSettings {
  enabled: boolean;
  include_team: boolean;
  last_sent_at: string | null;
  next_run_at: string | null;
}

export async function getReportSettings(projectId: string): Promise<ReportSettings> {
  const res = await fetch(`${API_V1}/projects/${projectId}/report`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load the weekly report settings');
  return res.json();
}

export async function saveReportSettings(projectId: string, body: { enabled: boolean; include_team: boolean }): Promise<ReportSettings> {
  const res = await fetch(`${API_V1}/projects/${projectId}/report`, { method: 'PUT', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save the weekly report settings');
  return res.json();
}

export async function sendReportPreview(projectId: string): Promise<{ status: string; sent_to: number }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/report/send`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not send the report');
  return res.json();
}
