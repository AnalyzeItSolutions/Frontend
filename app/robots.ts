import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/site';
import { DATA_SITEMAP_COUNT } from './lib/wdi/wdi';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/research',
        '/globe',
        '/connectors',
        '/objects',
        '/profile',
        '/billing',
        '/new-project',
        '/project',
        '/ops',
        '/memory',
        '/embeddings',
        '/onboarding',
        '/digest',
        '/invite',
        '/native-login',
        '/oauth',
        '/approve',
        '/api/',
      ],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, ...Array.from({ length: DATA_SITEMAP_COUNT }, (_, i) => `${SITE_URL}/sitemaps/data/sitemap/${i}.xml`), `${SITE_URL}/sitemaps/unicode/sitemap.xml`],
    host: SITE_URL,
  };
}
