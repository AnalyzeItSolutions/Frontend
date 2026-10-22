export type Expr = string | number | [string, Expr, Expr];
export type Metric = {
  slug: string; name: string; abbr?: string; category: string; unit: string; scale?: number; column_name: string;
  expr?: Expr; kind?: 'growth' | 'cmgr'; column?: string;
  formula: string; answer: string; why: string; read: string; pitfalls: string[]; related: string[];
};
export type Results = { overall: number; perMonth: { month: string; value: number }[]; inputs: Record<string, number> };
export function columnsOf(node: Expr): string[];
export function evaluate(node: Expr, leaf: (col: string) => number): number;
export function sums(rows: Record<string, number>[], cols: string[]): Record<string, number>;
export function fmt(v: number | null | undefined, unit: string): string;
export function round2(v: number): number;
export function results(metric: Metric): Results;
export function workedLine(metric: Metric): string;
export function excel(metric: Metric): { overall: string; perMonth: string; perMonthStartRow: number; safe: string };
export function sql(metric: Metric): { overall: string; perMonth: string | null; plain?: string };
export function pandas(metric: Metric): string;
