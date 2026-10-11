import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export interface AlertSettings {
  enabled: boolean;
  email: boolean;
  slack: boolean;
  webhooks: boolean;
}

export interface ProjectAlert {
  id: string;
  kind: string;
  severity: 'high' | 'medium' | string;
  title: string;
  detail: string;
  created_at: string | null;
  delivery: Record<string, string>;
  read: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  has_secret: boolean;
  created_at?: string;
}

export const WEBHOOK_EVENTS: Array<{ id: string; label: string }> = [
  { id: 'alert.created', label: 'An alert is raised' },
  { id: 'digest.created', label: 'A weekly digest is made' },
];

export async function getAlertSettings(projectId: string): Promise<AlertSettings> {
  const res = await fetch(`${API_V1}/projects/${projectId}/alerts/settings`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load alert settings');
  return res.json();
}

export async function saveAlertSettings(projectId: string, body: AlertSettings): Promise<AlertSettings> {
  const res = await fetch(`${API_V1}/projects/${projectId}/alerts/settings`, { method: 'PUT', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save alert settings');
  return res.json();
}

export async function listAlerts(projectId: string): Promise<{ alerts: ProjectAlert[]; unread: number }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/alerts`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load alerts');
  return res.json();
}

export async function checkAlertsNow(projectId: string): Promise<{ created: ProjectAlert[] }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/alerts/check`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not check for alerts');
  return res.json();
}

export async function markAlertsRead(projectId: string): Promise<void> {
  await fetch(`${API_V1}/projects/${projectId}/alerts/read`, { method: 'POST', headers: { ...getAuthHeaders() } });
}

export async function listWebhooks(): Promise<Webhook[]> {
  const res = await fetch(`${API_V1}/webhooks`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load webhooks');
  return res.json();
}

export async function createWebhook(body: { url: string; events: string[]; secret?: string }): Promise<void> {
  const res = await fetch(`${API_V1}/webhooks`, { method: 'POST', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not add the webhook');
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`${API_V1}/webhooks/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not remove the webhook');
}

export async function testWebhook(id: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const res = await fetch(`${API_V1}/webhooks/${id}/test`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not send a test');
  return res.json();
}
