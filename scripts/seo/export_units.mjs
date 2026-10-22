// Writes each /convert pair's published result for 1, 37.5 and 1000 units.  Usage: node scripts/seo/export_units.mjs <out.json>
import fs from 'node:fs';
import { PAIRS, convert } from '../../app/lib/convert/units.mjs';

const out = PAIRS.map((p) => ({ slug: p.slug, from: p.from.id, to: p.to.id, values: [1, 37.5, 1000].map((v) => [v, convert(p, v)]) }));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(`${out.length} pairs exported`);
