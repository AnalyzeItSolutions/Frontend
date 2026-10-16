import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';
import type { WidgetSpec } from './chatApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  is_public: boolean;
  author_id: string;
  builtin?: boolean;
  widgets: WidgetSpec[];
}

/** The templates this person saved (built-in and other people's public ones are left out: their widgets use a different shape). */
export async function listMyTemplates(userId: string): Promise<UserTemplate[]> {
  const res = await fetch(`${API_V1}/templates`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load your templates');
  const all = (await res.json()) as UserTemplate[];
  return all.filter((t) => !t.builtin && t.author_id === userId);
}

export async function saveTemplate(name: string, widgets: WidgetSpec[]): Promise<UserTemplate> {
  const res = await fetch(`${API_V1}/templates`, {
    method: 'POST',
    headers: { ...json, ...getAuthHeaders() },
    body: JSON.stringify({ name, description: '', tags: [], widgets, is_public: false }),
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save the template');
  return res.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_V1}/templates/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not delete the template');
}
