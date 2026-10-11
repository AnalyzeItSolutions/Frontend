// Social posting queue. A post is a markdown file in queue/ with a small header. Nothing is sent unless the file says
// `status: approved` (a human edits that line) AND the command is run with --yes. Zero dependencies; fetch is injectable for tests.
import fs from 'node:fs';
import path from 'node:path';

export const LIMITS = { x: 280, bluesky: 300, mastodon: 500, linkedin: 3000 };
export const PLATFORMS = Object.keys(LIMITS);

export function parsePost(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing header: start the file with --- / platform: / status: / ---');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  // Parts of a thread are separated by a line holding only "===".
  const parts = m[2].trim().split(/\n===\n/).map((p) => p.trim()).filter(Boolean);
  return { meta, parts };
}

export function graphemes(s) {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s)].length;
}

// Returns a list of problems; empty means the post can be sent.
export function validate({ meta, parts }) {
  const problems = [];
  if (!PLATFORMS.includes(meta.platform)) problems.push(`platform must be one of ${PLATFORMS.join(', ')}`);
  if (!parts.length) problems.push('no text');
  const limit = LIMITS[meta.platform];
  parts.forEach((p, i) => {
    // X counts every link as 23 characters.
    const len = meta.platform === 'x' ? graphemes(p.replace(/https?:\/\/\S+/g, 'x'.repeat(23))) : graphemes(p);
    if (limit && len > limit) problems.push(`part ${i + 1} is ${len} characters; ${meta.platform} allows ${limit}`);
  });
  if (parts.length > 1 && meta.platform === 'linkedin') problems.push('linkedin posts cannot be threads');
  if (parts.length > 1 && meta.platform === 'reddit') problems.push('reddit is not supported');
  return problems;
}

export function canSend({ meta }, { yes }) {
  if (meta.posted) return `already posted: ${meta.posted}`;
  if (meta.status !== 'approved') return `status is "${meta.status || 'none'}"; set it to "approved" after you have read the text`;
  if (!yes) return 'dry run: add --yes to send';
  return null;
}

export function markPosted(raw, url) {
  const stamp = `posted: ${url}\nposted_at: ${new Date().toISOString()}`;
  return raw.replace(/^---\n/, '---\n' + stamp + '\n').replace(/^status:.*$/m, 'status: posted');
}

const j = async (res, what) => {
  const body = await res.text();
  if (!res.ok) throw new Error(`${what} failed (${res.status}): ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : {};
};

export const adapters = {
  async bluesky(parts, env, f = fetch) {
    const host = env.BLUESKY_HOST || 'https://bsky.social';
    const s = await j(await f(`${host}/xrpc/com.atproto.server.createSession`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: env.BLUESKY_HANDLE, password: env.BLUESKY_APP_PASSWORD }) }), 'bluesky login');
    let root, parent, first;
    for (const text of parts) {
      const enc = new TextEncoder();
      const facets = [];
      for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) {   // links are only clickable when declared as facets, in UTF-8 byte offsets
        const start = enc.encode(text.slice(0, m.index)).length;
        facets.push({ index: { byteStart: start, byteEnd: start + enc.encode(m[0]).length }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }] });
      }
      const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), ...(facets.length ? { facets } : {}), ...(root ? { reply: { root, parent } } : {}) };
      const r = await j(await f(`${host}/xrpc/com.atproto.repo.createRecord`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${s.accessJwt}` }, body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }) }), 'bluesky post');
      const ref = { uri: r.uri, cid: r.cid };
      root ??= ref; parent = ref; first ??= r.uri;
    }
    return `https://bsky.app/profile/${env.BLUESKY_HANDLE}/post/${first.split('/').pop()}`;
  },
  async mastodon(parts, env, f = fetch) {
    let prev, first;
    for (const status of parts) {
      const r = await j(await f(`${env.MASTODON_INSTANCE}/api/v1/statuses`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.MASTODON_TOKEN}` }, body: JSON.stringify({ status, ...(prev ? { in_reply_to_id: prev } : {}) }) }), 'mastodon post');
      prev = r.id; first ??= r.url;
    }
    return first;
  },
  async x(parts, env, f = fetch) {   // needs an OAuth 2.0 user token with tweet.write
    let prev, first;
    for (const text of parts) {
      const r = await j(await f('https://api.x.com/2/tweets', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.X_USER_TOKEN}` }, body: JSON.stringify({ text, ...(prev ? { reply: { in_reply_to_tweet_id: prev } } : {}) }) }), 'x post');
      prev = r.data.id; first ??= r.data.id;
    }
    return `https://x.com/i/status/${first}`;
  },
  async linkedin(parts, env, f = fetch) {   // needs w_member_social; LINKEDIN_AUTHOR is urn:li:person:<id>
    const r = await f('https://api.linkedin.com/v2/ugcPosts', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.LINKEDIN_TOKEN}`, 'x-restli-protocol-version': '2.0.0' }, body: JSON.stringify({ author: env.LINKEDIN_AUTHOR, lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: parts[0] }, shareMediaCategory: 'NONE' } }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } }) });
    const id = r.headers.get('x-restli-id') || (await j(r, 'linkedin post')).id;
    if (!r.ok) throw new Error(`linkedin post failed (${r.status})`);
    return `https://www.linkedin.com/feed/update/${id}`;
  },
};

export function loadEnv(file) {
  const env = { ...process.env };
  if (fs.existsSync(file)) for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

export const REQUIRED = { bluesky: ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'], mastodon: ['MASTODON_INSTANCE', 'MASTODON_TOKEN'], x: ['X_USER_TOKEN'], linkedin: ['LINKEDIN_TOKEN', 'LINKEDIN_AUTHOR'] };
export const missingEnv = (platform, env) => (REQUIRED[platform] || []).filter((k) => !env[k]);
export const queueDir = (here) => path.join(here, 'queue');
