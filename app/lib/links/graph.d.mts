import type { Guide } from '../guides.mjs';
export const GUIDE_LINKS: Record<string, { guides: string[]; methods: string[]; metrics: string[]; tools: string[] }>;
export const TOOL_GUIDES: Record<string, string[]>;
export const GUIDE_FOR_TOOL: Record<string, string>;
export const METRIC_METHODS: string[];
export const METRIC_GUIDES: string[];
export const METHOD_REFS: Record<string, [string, string][]>;
export const NIST_HANDBOOK: [string, string];
export function guidesForMethod(slug: string, guides: Guide[]): Guide[];
