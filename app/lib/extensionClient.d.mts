export type ExtensionState = { connected: boolean; version: string | null; platforms: Record<string, { label: string; allowed: boolean; cap: number; used: number; paused: boolean }>; paused: boolean };
export type FillResult = { ok: boolean; reason?: string; needsPermission?: string };
export type ExtensionOutcome = { draftId: string; ok: boolean; state?: string; reason?: string };
export function createExtensionClient(win?: Window): {
  readonly state: ExtensionState;
  ping(): void;
  onChange(f: (s: ExtensionState) => void): () => void;
  onResult(f: (r: ExtensionOutcome) => void): () => void;
  fill(job: { draftId: string; platform: string; text: string; text_sha256: string }): Promise<FillResult>;
};
