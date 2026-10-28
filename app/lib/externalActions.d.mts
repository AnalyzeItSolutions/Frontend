export interface ActionField {
  name: string;
  label: string;
  kind: 'text' | 'longtext' | 'url' | 'int' | 'choice' | 'json';
  required: boolean;
  max_len: number;
  choices: string[];
  help: string;
}
export function riskLabel(risk: string): string;
export function isFinal(status: string): boolean;
export function statusText(status: string): string;
export function draftFromParams(fields: ActionField[], params: Record<string, unknown>): Record<string, string>;
export function paramsFromDraft(fields: ActionField[], draft: Record<string, string>): Record<string, string | number>;
export function sameParams(fields: ActionField[], a: Record<string, unknown>, b: Record<string, unknown>): boolean;
export function draftProblems(fields: ActionField[], draft: Record<string, string>): Record<string, string>;
export function safeLink(url: unknown): string | null;
export function looksLikeSecret(text: string): boolean;
export const SECRET_WARNING: string;
export function explainActionError(status: number, message?: string): string;
export function isPlanFinal(status: string): boolean;
export function planStatusText(status: string, steps: Array<{ n: number; status: string }>): string;
export function stepStatusText(status: string): string;
export function planRisk(steps: Array<{ risk: string }>): 'low' | 'medium' | 'high';
export function splitStepRefs(text: unknown): Array<{ text: string; ref?: { step: number; key: string } }>;
