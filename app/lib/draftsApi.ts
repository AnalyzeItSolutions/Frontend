import { getAuthHeaders } from './auth';
import type { Draft } from './drafts.mjs';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;

export type VoiceProfile = {
  stats: { posts?: number; avg_words?: number; emoji_per_post?: number; hashtags_per_post?: number };
  edit_lessons: string[];
  examples: string[];
  sources: { samples: number; finals: number; edits: number };
  prompt: string;
};

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...getAuthHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong. Try again.');
  return data as T;
}

export const listDrafts = () => call<{ drafts: Draft[] }>('GET', '/drafts?limit=100').then((r) => r.drafts);
export const createDraft = (platform: string, text: string) => call<Draft>('POST', '/drafts', { platform, text, source: 'app' });
export const saveDraft = (id: string, text: string) => call<Draft>('PATCH', `/drafts/${encodeURIComponent(id)}`, { text });
export const approveDraft = (d: Draft) => call<Draft>('POST', `/drafts/${encodeURIComponent(d.id)}/approve`, { text_sha256: d.text_sha256 });
export const markSent = (id: string) => call<Draft>('POST', `/drafts/${encodeURIComponent(id)}/sent`);
export const cancelDraft = (id: string) => call<Draft>('POST', `/drafts/${encodeURIComponent(id)}/cancel`);
export const composeLink = (id: string) => call<{ url: string }>('GET', `/drafts/${encodeURIComponent(id)}/compose-link`);
export const getVoice = () => call<VoiceProfile>('GET', '/voice/profile');
export const addVoiceSamples = (texts: string[]) => call<{ stored: number }>('POST', '/voice/samples', { texts });
export const forgetVoice = () => call<{ deleted: number }>('DELETE', '/voice');

import type { BrowserPlan } from './drafts.mjs';
export const listPlans = () => call<{ plans: BrowserPlan[] }>('GET', '/browser-plans').then((r) => r.plans);
export const getPlan = (id: string) => call<BrowserPlan>('GET', `/browser-plans/${encodeURIComponent(id)}`);
export const planFromDraft = (draftId: string, commit: boolean) => call<BrowserPlan>('POST', `/drafts/${encodeURIComponent(draftId)}/plan`, { commit });
export const approvePlan = (p: BrowserPlan) => call<BrowserPlan>('POST', `/browser-plans/${encodeURIComponent(p.id)}/approve`, { plan_sha256: p.plan_sha256 });
export const cancelPlan = (id: string) => call<BrowserPlan>('POST', `/browser-plans/${encodeURIComponent(id)}/cancel`);
export const reportPlan = (id: string, body: { ok: boolean; reason?: string; cancelled?: boolean; results?: unknown[] }) => call<BrowserPlan>('POST', `/browser-plans/${encodeURIComponent(id)}/result`, body);
