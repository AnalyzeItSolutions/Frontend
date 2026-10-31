import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export interface AreaWatch {
  id: string;
  name: string;
  ring: Array<{ lat: number; lon: number }>;
  layers: string[];
  thresholds: Record<string, number>;
  enabled: boolean;
  inside_now: number | null;
  alerts_sent: number;
  last_checked: string | null;
}

export interface WatchLayer {
  id: string;
  label: string;
  min_key: string | null;
  default: number | null;
}

export async function listAreaWatches(projectId: string): Promise<{ watches: AreaWatch[]; layers: WatchLayer[] }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/area-watches`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load watched areas');
  return res.json();
}

export async function addAreaWatch(
  projectId: string,
  body: { name: string; ring: Array<{ lat: number; lon: number }>; layers: string[]; thresholds: Record<string, number> },
): Promise<AreaWatch> {
  const res = await fetch(`${API_V1}/projects/${projectId}/area-watches`, {
    method: 'POST',
    headers: { ...json, ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not watch this area');
  return res.json();
}

export async function deleteAreaWatch(projectId: string, watchId: string): Promise<void> {
  const res = await fetch(`${API_V1}/projects/${projectId}/area-watches/${watchId}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not stop watching this area');
}
