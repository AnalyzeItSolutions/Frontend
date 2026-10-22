import type { Method } from './pages.mjs';
export type { Method };
export const METHODS: Method[];
export const METHOD_CATEGORIES: { slug: string; name: string }[];
export function method(slug: string): Method | undefined;
export function methodResults(m: Method): { value: number };
export function methodTools(m: Method): ('excel' | 'sql' | 'python')[];
