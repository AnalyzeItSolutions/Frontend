import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/v1`;

export type ComputerTaskStatus = 'running' | 'needs_you' | 'done' | 'failed' | 'stopped' | 'expired';

/** A step the agent took (or is waiting on). `detail.text` is always "<hidden>"; no typed text ever reaches the client. */
export interface ComputerStep {
  n: number;
  action: string;
  detail: Record<string, unknown>;
  verdict: 'allow' | 'pause' | 'ask' | string;
  reason: string;
  note: string;
  url: string;
}

export interface ComputerWaiting {
  /** "pause": sign in yourself in the live view, then Continue. "ask": approve this one step. */
  kind: 'pause' | 'ask';
  reason: string;
  action: Record<string, unknown>;
}

export interface ComputerTask {
  id: string;
  status: ComputerTaskStatus;
  goal: string;
  message: string;
  steps: ComputerStep[];
  step_count: number;
  waiting: ComputerWaiting | null;
  has_screenshot: boolean;
  has_recording: boolean;
  recording_url: string | null;
  recording_bytes: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export const TASK_FINAL: ComputerTaskStatus[] = ['done', 'failed', 'stopped', 'expired'];
export const isTaskFinal = (s: ComputerTaskStatus): boolean => TASK_FINAL.includes(s);

export async function startComputerTask(goal: string, projectId?: string): Promise<ComputerTask> {
  const res = await fetch(`${API_V1}/computer-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ goal, project_id: projectId }),
    cache: 'no-store',
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not start the task');
  return res.json();
}

export async function getComputerTask(id: string): Promise<ComputerTask> {
  const res = await fetch(`${API_V1}/computer-tasks/${encodeURIComponent(id)}`, { headers: { ...getAuthHeaders() }, cache: 'no-store' });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load the task');
  return res.json();
}

/** The latest screenshot as an object URL the caller must revoke. Null when there is none yet. */
export async function computerTaskShot(id: string): Promise<string | null> {
  const res = await fetch(`${API_V1}/computer-tasks/${encodeURIComponent(id)}/screenshot`, { headers: { ...getAuthHeaders() }, cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load the live view');
  return URL.createObjectURL(await res.blob());
}

export async function resumeComputerTask(id: string, decision: 'continue' | 'deny'): Promise<ComputerTask> {
  const res = await fetch(`${API_V1}/computer-tasks/${encodeURIComponent(id)}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not continue the task');
  return res.json();
}

/** Fetch the session recording and save it to the person's device. No-op if there is none yet. */
export async function downloadComputerTaskRecording(id: string): Promise<void> {
  const res = await fetch(`${API_V1}/computer-tasks/${encodeURIComponent(id)}/recording`, { headers: { ...getAuthHeaders() }, cache: 'no-store' });
  if (!res.ok) throw await apiErrorFrom(res, 'The recording is not available');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${id}.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function stopComputerTask(id: string): Promise<ComputerTask> {
  const res = await fetch(`${API_V1}/computer-tasks/${encodeURIComponent(id)}/stop`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not stop the task');
  return res.json();
}
