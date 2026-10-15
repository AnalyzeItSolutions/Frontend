export type Draft = { id: string; platform: string; text: string; status: 'draft' | 'approved' | 'sent' | 'cancelled'; text_sha256: string; limit: number; source?: string; created_at: string; updated_at: string };
export const PLATFORMS: ReadonlyArray<{ id: string; label: string; limit: number; site: string }>;
export function platform(id: string): { id: string; label: string; limit: number; site: string } | null;
export function charsLeft(platformId: string, text: string): number;
export function statusLabel(status: string): string;
export function canApprove(draft: Draft | null, editedText?: string): boolean;
export function isDirty(draft: Draft, editedText: string | undefined): boolean;
export function fillMessage(outcome: { ok: boolean; reason?: string } | null | undefined): string;
export function extensionLabel(state: import('./extensionClient.mjs').ExtensionState | null): string;
export function extensionBlock(state: import('./extensionClient.mjs').ExtensionState | null, platformId: string): string | null;

export type PlanStep = { type: string; url?: string; what?: string; target?: { label?: string; name?: string }; text?: string; direction?: string; ms?: number; platform?: string; commit?: boolean };
export type BrowserPlan = { id: string; title: string; mode: string; steps: PlanStep[]; status: 'proposed' | 'approved' | 'done' | 'failed' | 'cancelled'; plan_sha256: string; source?: string; draft_id?: string | null; results?: Array<{ index: number; ok: boolean; reason?: string; text?: string; untrusted?: boolean }>; reason?: string | null; updated_at: string };
export function describePlanStep(s: PlanStep): string;
export function planStatusLabel(status: string): string;
export function planPostsForYou(plan: { steps?: PlanStep[] } | null | undefined): boolean;
export function planBlock(plan: BrowserPlan, state: import('./extensionClient.mjs').ExtensionState | null): string | null;
export function planOutcomeMessage(m: { ok?: boolean; cancelled?: boolean; reason?: string; plan?: { steps?: PlanStep[] } } | null | undefined): string;
