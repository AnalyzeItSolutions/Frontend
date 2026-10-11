#!/usr/bin/env node
// Usage: node scripts/social/post.mjs list | check <file> | send <file> [--yes]
import fs from 'node:fs';
import path from 'node:path';
import { adapters, canSend, loadEnv, markPosted, missingEnv, parsePost, queueDir, validate } from './lib.mjs';

const here = import.meta.dirname;
const [cmd, arg, ...flags] = process.argv.slice(2);
const resolve = (f) => (fs.existsSync(f) ? f : path.join(queueDir(here), f));

if (cmd === 'list') {
  for (const f of fs.readdirSync(queueDir(here)).filter((x) => x.endsWith('.md'))) {
    const { meta, parts } = parsePost(fs.readFileSync(path.join(queueDir(here), f), 'utf8'));
    console.log(`${f.padEnd(40)} ${String(meta.platform).padEnd(9)} ${String(meta.status).padEnd(9)} ${parts.length} part(s)${meta.posted ? ' ' + meta.posted : ''}`);
  }
} else if ((cmd === 'check' || cmd === 'send') && arg) {
  const file = resolve(arg);
  const raw = fs.readFileSync(file, 'utf8');
  const post = parsePost(raw);
  const problems = validate(post);
  const env = loadEnv(path.join(here, '..', '..', '.env.social'));
  const miss = missingEnv(post.meta.platform, env);
  if (miss.length) problems.push(`missing credentials: ${miss.join(', ')} (put them in frontend/.env.social)`);
  if (problems.length) { console.error('Not ready:\n- ' + problems.join('\n- ')); process.exit(1); }
  if (cmd === 'check') { console.log(`OK for ${post.meta.platform}, ${post.parts.length} part(s).`); process.exit(0); }
  const blocked = canSend(post, { yes: flags.includes('--yes') });
  if (blocked) { console.log(blocked); process.exit(blocked.startsWith('dry run') ? 0 : 1); }
  const url = await adapters[post.meta.platform](post.parts, env);
  fs.writeFileSync(file, markPosted(raw, url));
  console.log('Posted:', url);
} else {
  console.error('Usage: post.mjs list | check <file> | send <file> [--yes]');
  process.exit(2);
}
