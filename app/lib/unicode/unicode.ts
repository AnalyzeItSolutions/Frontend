import charsJson from './chars.json';
import metaJson from './meta.json';
import { titleCase } from './encode.mjs';

// Unicode Character Database index behind /unicode (built by scripts/seo/build_unicode_index.py). Everything a character
// page shows is in this bundle, so pages need no network call.

type Row = [cp: number, name: string, gc: string, ccc: number, bidi: string, decomp: string, numeric: string, mirrored: 0 | 1, upper: number | null, lower: number | null, title: number | null, script: string | null, age: string | null, block: number | null, emoji: string | null, entities: string[] | null, alias: string | null];

export type Char = { cp: number; name: string; gc: string; ccc: number; bidi: string; decomp: string; numeric: string; mirrored: boolean; upper: number | null; lower: number | null; title: number | null; script: string | null; age: string | null; block: number | null; emoji: string | null; entities: string[] | null; alias: string | null; slug: string; hex: string };
export type Block = { start: number; end: number; name: string; slug: string; count: number; index: number };

const meta = metaJson as unknown as { version: string; emoji_version: string; count: number; blocks: [number, number, string, string, number][] };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const UNICODE_VERSION = meta.version;
export const EMOJI_VERSION = meta.emoji_version;
export const CHAR_COUNT = meta.count;
export const BLOCKS: Block[] = meta.blocks.map(([start, end, name, slug, count], index) => ({ start, end, name, slug, count, index }));

export const CHARS: Char[] = (charsJson as unknown as Row[]).map(([cp, name, gc, ccc, bidi, decomp, numeric, mirrored, upper, lower, title, script, age, block, emoji, entities, alias]) => {
  const hex = cp.toString(16).padStart(4, '0');
  return { cp, name, gc, ccc, bidi, decomp, numeric, mirrored: mirrored === 1, upper, lower, title, script, age, block, emoji, entities, alias, hex, slug: `${hex}-${slugify(name)}` };
});
const byCp = new Map(CHARS.map((c) => [c.cp, c]));
const blockBySlug = new Map(BLOCKS.map((b) => [b.slug, b]));

export const charAt = (cp: number | null | undefined) => (cp == null ? undefined : byCp.get(cp));
/** A URL segment starts with the hex code point; the name after it is only for people, so a stale name still resolves. */
export const charFromSlug = (slug: string) => {
  const m = /^([0-9a-f]{4,6})(?:-|$)/i.exec(slug);
  return m ? byCp.get(parseInt(m[1], 16)) : undefined;
};
export const block = (slug: string) => blockBySlug.get(slug);
export const blockOf = (c: Char) => (c.block == null ? undefined : BLOCKS[c.block]);
export const charsIn = (b: Block) => CHARS.filter((c) => c.block === b.index);
export const glyph = (c: Char) => String.fromCodePoint(c.cp);
/** Display name: the emoji's CLDR name when it has one, otherwise the Unicode name in Title Case. */
export const displayName = (c: Char) => (c.emoji ? c.emoji.charAt(0).toUpperCase() + c.emoji.slice(1) : /^[A-Z0-9 -]+$/.test(c.name) ? titleCase(c.name) : c.name);
export const charPath = (c: Char) => `/unicode/${c.slug}`;
export { slugify };
