export type Kind = 'pct' | 'usd' | 'level';
export type P = { year: number; value: number | null };
export type Change = { from: { year: number; value: number }; points?: number; pct?: number | null; cagr?: number | null } | null;
export type Summary = {
  latest: { year: number; value: number }; first: { year: number; value: number }; max: { year: number; value: number }; min: { year: number; value: number };
  count: number; five: Change; ten: Change; sinceFirst: Change; avg10: number; avg10From: number; missing: number;
};
export function kindOf(name: string): Kind;
export function fmtNum(v: number | null | undefined): string;
export function fmtValue(v: number | null | undefined, kind: Kind): string;
export function fmtExact(v: number | null | undefined): string;
export function summarize(points: P[], kind: Kind): Summary | null;
export function changeSentence(ch: Change, kind: Kind): string | null;
export function rankAmong(entries: { value: number }[], value: number): { rank: number; of: number };
export function ordinal(n: number): string;
export function lowerFirst(s: string): string;
