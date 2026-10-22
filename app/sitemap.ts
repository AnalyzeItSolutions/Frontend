import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/site';
import { GUIDES } from './lib/guides.mjs';
import { LIVE_CASES, LIVE_CASES_UPDATED } from './lib/liveCases.mjs';
import { DATA_UPDATED } from './lib/pseo/data.mjs';
import { allMethodPaths, allMetricPaths } from './lib/pseo/pages.mjs';

const publicPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/demo', changeFrequency: 'monthly', priority: 0.95 },
  { path: '/try', changeFrequency: 'monthly', priority: 0.95 },
  { path: '/case', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/features', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/products', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/docs', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/docs/how-answers-work', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/docs/discovery', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/docs/connect-assistant', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/docs/plans', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/docs/memory', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/docs/tokens', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/docs/connectors', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/changelog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/cases', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/metrics', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/methods', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/data', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/indicators', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/cases/usd-to-inr', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/cases/weather-mumbai', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/cases/aapl-stock-price', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/security', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/dpa', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/acceptable-use', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/shipping', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.3 },
];

// A "last modified" that always says "now" teaches search engines to ignore it, so only pages with a known date carry one.
const knownDates: Record<string, string> = { '/docs/discovery': '2026-10-06', '/docs/tokens': '2026-10-16', '/guides': '2026-10-21', '/features': '2026-10-21', '/changelog': '2026-10-06', '/cases': LIVE_CASES_UPDATED, '/metrics': DATA_UPDATED, '/methods': DATA_UPDATED };

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = publicPaths.map(({ path, changeFrequency, priority }) => ({
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    ...(knownDates[path] ? { lastModified: new Date(knownDates[path]) } : {}),
    changeFrequency,
    priority,
  }));
  const guides = GUIDES.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: new Date(g.published), changeFrequency: 'monthly' as const, priority: 0.8 }));
  const cases = LIVE_CASES.map((c) => ({ url: `${SITE_URL}/cases/${c.slug}`, lastModified: new Date(LIVE_CASES_UPDATED), changeFrequency: 'weekly' as const, priority: 0.7 }));
  // Reference pages: a hub per metric or method (0.7) and one page per tool (0.5), all dated by the sample data they show.
  const reference = [...allMetricPaths(), ...allMethodPaths()].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(DATA_UPDATED),
    changeFrequency: 'monthly' as const,
    priority: p.split('/').length === 3 ? 0.7 : 0.5,
  }));
  return [...fixed, ...guides, ...cases, ...reference];
}
