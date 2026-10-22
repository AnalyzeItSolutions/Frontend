import type { Metric } from './expr.mjs';
export type { Metric };
export const METRIC_CATEGORIES: { slug: string; name: string }[];
export const METRICS: Metric[];
export function metric(slug: string): Metric | undefined;
