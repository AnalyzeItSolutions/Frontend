import type { Guide } from './guides.mjs';
export const DEEP_GUIDES: Guide[];
export const GUIDE_CHECKS: { id: string; dataset: string; expected: number; tolerance?: number; excel: { overall: string; scale: number }; sql: { overall: string }; pandas: { code: string; total: string } }[];
