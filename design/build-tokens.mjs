import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildCss } from './tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const targets = [
  path.join(here, 'tokens.css'),
  path.join(here, '..', '..', 'native', 'desktop', 'ui', 'tokens.css'),
];

const css = buildCss();
if (process.argv.includes('--check')) {
  const stale = targets.filter((t) => !existsSync(t) || readFileSync(t, 'utf8') !== css);
  if (stale.length) {
    console.error('Stale design tokens, run: node design/build-tokens.mjs\n' + stale.join('\n'));
    process.exit(1);
  }
} else {
  for (const t of targets) if (existsSync(path.dirname(t))) writeFileSync(t, css);
}
