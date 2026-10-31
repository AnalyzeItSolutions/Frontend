// Unwanted crawlers are refused; search engines, AdSense, AI assistants, link previews and people are not.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { BLOCKED_BOTS, blockedBotHeaderPattern, isBlockedBot } from './botPolicy.mjs';

const KEPT = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'Mediapartners-Google',
  'AdsBot-Google (+http://www.google.com/adsbot.html)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
  'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  'Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)',
  'Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)',
  'Mozilla/5.0 (compatible; SeekportBot; +https://bot.seekport.com)',
  'Mozilla/5.0 (compatible; Qwantbot/1.0; +https://help.qwant.com/bot/)',
  'Mozilla/5.0 (compatible; MojeekBot/0.11; +https://www.mojeek.com/bot.html)',
  'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)',
  'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
  'DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)',
  'Mozilla/5.0 (compatible; YouBot/1.0; +https://about.you.com/youbot/)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)',
  'meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36',
  'CCBot/2.0 (https://commoncrawl.org/faq/)',
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  'Twitterbot/1.0',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'WhatsApp/2.23.20.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
];

const BLOCKED = [
  'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
  'Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)',
  'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
  'Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)',
  'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
];

describe('bot policy', () => {
  it('keeps every search engine, AI search and assistant fetcher, AdSense, AI assistants, link previews and browsers', () => {
    for (const ua of KEPT) assert.equal(isBlockedBot(ua), false, ua);
  });
  it('refuses SEO tools, scrapers and no-return crawlers', () => {
    for (const ua of BLOCKED) assert.equal(isBlockedBot(ua), true, ua);
  });
  it('lets requests without a user agent through', () => {
    assert.equal(isBlockedBot(''), false);
    assert.equal(isBlockedBot(null), false);
  });
  it('the next.config rewrite refuses exactly what isBlockedBot refuses, in any letter case', () => {
    const rule = new RegExp(`^${blockedBotHeaderPattern()}$`);
    for (const ua of [...KEPT, ...BLOCKED]) assert.equal(rule.test(ua), isBlockedBot(ua), ua);
    for (const ua of BLOCKED) assert.equal(rule.test(ua.toLowerCase()), true, ua);
    const config = fs.readFileSync(path.resolve(import.meta.dirname, '../../next.config.ts'), 'utf8');
    assert.match(config, /value: blockedBotHeaderPattern\(\)/);
    assert.match(config, /destination: '\/blocked\.txt'/);
  });
  it('robots.txt names the same list the proxy refuses', () => {
    const robots = fs.readFileSync(path.resolve(import.meta.dirname, '../robots.ts'), 'utf8');
    assert.match(robots, /userAgent: BLOCKED_BOTS, disallow: '\/'/);
    assert.ok(BLOCKED_BOTS.length > 20);
  });
});
