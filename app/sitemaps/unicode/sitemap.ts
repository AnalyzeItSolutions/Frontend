import type { MetadataRoute } from 'next';
import { BLOCKS, CHARS } from '../../lib/unicode/unicode';
import { SITE_URL } from '../../lib/site';

// /unicode pages: the hub, every block with characters and every named character (~34k, under the 50,000 limit).
// Served at /sitemaps/unicode/sitemap.xml and listed in robots.txt.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/unicode`, changeFrequency: 'yearly', priority: 0.7 },
    ...BLOCKS.filter((b) => b.count).map((b) => ({ url: `${SITE_URL}/unicode/blocks/${b.slug}`, changeFrequency: 'yearly' as const, priority: 0.5 })),
    ...CHARS.map((c) => ({ url: `${SITE_URL}/unicode/${c.slug}`, changeFrequency: 'yearly' as const, priority: 0.4 })),
  ];
}
