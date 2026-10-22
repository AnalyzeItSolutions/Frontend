import type { MetadataRoute } from 'next';
import { COUNTRIES, DATA_SITEMAP_COUNT, DATA_SITEMAP_PER as PER, INDICATORS, allPairs } from '../../lib/wdi/wdi';
import { SITE_URL } from '../../lib/site';

// The /data and /indicators pages, split into files of at most DATA_SITEMAP_PER URLs (Google allows 50,000 per sitemap).
// Served at /sitemaps/data/sitemap/<id>.xml and listed in robots.txt. Sitemap 0 holds the hubs and rankings.
const PAIRS = [...allPairs()].map(([c, i]) => `/data/${c.slug}/${i.slug}`);

export async function generateSitemaps() {
  return Array.from({ length: DATA_SITEMAP_COUNT }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  if (id === 0) {
    return [
      { url: `${SITE_URL}/data`, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${SITE_URL}/indicators`, changeFrequency: 'monthly', priority: 0.8 },
      ...COUNTRIES.map((c) => ({ url: `${SITE_URL}/data/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
      ...INDICATORS.map((i) => ({ url: `${SITE_URL}/indicators/${i.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ];
  }
  return PAIRS.slice((id - 1) * PER, id * PER).map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'monthly' as const, priority: 0.5 }));
}
