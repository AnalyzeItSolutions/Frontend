// Crawlers that bring the site nothing: SEO-tool indexers, bulk scrapers and training crawlers
// that send no visitors. They are listed in robots.txt and refused with 403 by the proxy,
// since many of them ignore robots.txt.
//
// Matching is on crawler names only; no browser user agent contains them, so people are never refused.
// Kept on purpose (never add these): every search engine (Googlebot, Bingbot, DuckDuckBot, Applebot,
// YandexBot, Baiduspider, PetalBot, Sogou, Seekport, Qwant, Mojeek, Yeti, Slurp), AdSense (Mediapartners-Google, AdsBot-Google), AI assistants that cite and link
// pages (OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, Claude-User, ClaudeBot,
// PerplexityBot, Perplexity-User, Google-Extended, DuckAssistBot, YouBot, MistralAI-User,
// meta-externalfetcher, Amazonbot, CCBot which feeds many AI models) and link previews (facebookexternalhit,
// Twitterbot, LinkedInBot, Slackbot, WhatsApp, Discordbot, TelegramBot).
export const BLOCKED_BOTS = [
  // SEO tools
  'AhrefsBot',
  'AhrefsSiteAudit',
  'SemrushBot',
  'SiteAuditBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'DataForSeoBot',
  'serpstatbot',
  'SEOkicks',
  'Barkrowler',
  'MegaIndex',
  'linkdexbot',
  'spbot',
  'Screaming Frog SEO Spider',
  // bulk scrapers and data resellers
  'Bytespider',
  'Diffbot',
  'omgili',
  'omgilibot',
  'ImagesiftBot',
  'Timpibot',
  'magpie-crawler',
  'Scrapy',
  'ZoominfoBot',
  'DataProvider',
  'MauiBot',
  'meta-externalagent',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'AI2Bot',
  'img2dataset',
  'VelenPublicWebCrawler',
  'Kangaroo Bot',
];

const pattern = new RegExp(BLOCKED_BOTS.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

export function isBlockedBot(userAgent) {
  return Boolean(userAgent) && pattern.test(userAgent);
}
