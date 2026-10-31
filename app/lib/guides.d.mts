export type GuideBlock = {
  p?: string;
  h2?: string;
  ul?: string[];
  ol?: string[];
  code?: { label?: string; code: string };
  table?: { caption?: string; head: string[]; rows: string[][] };
  faq?: { q: string; a: string }[];
};
export interface Guide {
  slug: string;
  title: string;
  /** Shorter title for the search result; the page heading keeps `title`. */
  seoTitle?: string;
  description: string;
  published: string;
  updated?: string;
  blocks: GuideBlock[];
  cta: { href: string; label: string };
}
export const GUIDES_UPDATED: string;
export const GUIDES: Guide[];
export function guide(slug: string): Guide | null;
export function blockText(b: GuideBlock): string[];
export function wordCount(g: Guide): number;
export function readMinutes(g: Guide): number;
