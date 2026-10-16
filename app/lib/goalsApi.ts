import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;
const json = { 'Content-Type': 'application/json' };

export type GoalEvery = 'daily' | 'weekly' | 'monthly';

export interface StandingGoal {
  id: string;
  question: string;
  every: GoalEvery;
  enabled: boolean;
  email: boolean;
  webhooks: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
}

export interface GoalRun {
  id: string;
  created_at: string | null;
  text: string;
  change: { new?: string[]; gone?: string[] };
  delivery: Record<string, string>;
}

export interface ReconcileFinding {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  count: number;
  payment_ids: string[];
  amount?: number;
}

export interface ReconcileResult {
  checked: { payments: number; refunds: number };
  findings: ReconcileFinding[];
  clean: boolean;
  not_checked: string[];
}

export async function listGoals(projectId: string): Promise<{ goals: StandingGoal[]; max: number }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load standing questions');
  return res.json();
}

export async function createGoal(projectId: string, body: { question: string; every: GoalEvery; email: boolean }): Promise<StandingGoal> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals`, { method: 'POST', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not add the question');
  return res.json();
}

export async function updateGoal(projectId: string, id: string, body: Partial<Pick<StandingGoal, 'enabled' | 'email' | 'every'>>): Promise<StandingGoal> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals/${id}`, { method: 'PUT', headers: { ...json, ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save');
  return res.json();
}

export async function deleteGoal(projectId: string, id: string): Promise<void> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not remove the question');
}

export async function runGoalNow(projectId: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals/${id}/run`, { method: 'POST', headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not run it');
  return res.json();
}

export async function listGoalRuns(projectId: string, id: string): Promise<GoalRun[]> {
  const res = await fetch(`${API_V1}/projects/${projectId}/goals/${id}/runs`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load past answers');
  return (await res.json()).runs;
}

export async function reconcilePayments(projectId: string): Promise<ReconcileResult> {
  const res = await fetch(`${API_V1}/projects/${projectId}/reconcile`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not check the books');
  return res.json();
}
