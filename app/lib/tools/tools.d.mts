export type Field = { key: string; label: string; type: 'text' | 'textarea'; default: string };
export type Tool = {
  slug: string; name: string; category: string; description: string; answer: string; fields: Field[]; modes?: { id: string; label: string }[];
  run(values: Record<string, string>, mode?: string): string | Promise<string>; how: string[]; examples: { values: Record<string, string>; mode?: string; output: string }[];
};
export const TOOLS: Tool[];
export const TOOL_CATEGORIES: string[];
export function tool(slug: string): Tool | undefined;
export function parseCsv(text: string, delim?: string): string[][];
