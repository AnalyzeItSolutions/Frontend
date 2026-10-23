export type ExtensionState = { connected: boolean; version: string | null; platforms: Record<string, { label: string; allowed: boolean; cap: number; used: number; paused: boolean }>; paused: boolean; autoRead: boolean; relay: { linked: boolean; online?: boolean; api?: string } };
export type FillResult = { ok: boolean; reason?: string; needsPermission?: string };
export type ExtensionOutcome = { draftId: string; ok: boolean; state?: string; reason?: string };
export type PlanEvent = { type: 'plan-progress' | 'plan-result'; planId: string; index?: number; status?: string; ok?: boolean; cancelled?: boolean; reason?: string; results?: Array<{ index: number; ok: boolean; reason?: string; text?: string; untrusted?: boolean }> };
export type PlanJob = { id: string; title: string; mode: string; steps: unknown[]; plan_sha256: string };
export function createExtensionClient(win?: Window): {
  readonly state: ExtensionState;
  ping(): void;
  onChange(f: (s: ExtensionState) => void): () => void;
  onResult(f: (r: ExtensionOutcome) => void): () => void;
  onPlan(f: (m: PlanEvent) => void): () => void;
  runPlan(plan: PlanJob): Promise<FillResult>;
  fill(job: { draftId: string; platform: string; text: string; text_sha256: string }): Promise<FillResult>;
  linkAccount(link: { token: string; api: string }): Promise<FillResult>;
  unlinkAccount(): Promise<FillResult>;
};
