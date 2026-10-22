// Writes every character's published codes for verify_unicode.py.  Usage: node scripts/seo/export_unicode.mjs <out.json>
import fs from 'node:fs';
import { codes } from '../../app/lib/unicode/encode.mjs';

const chars = JSON.parse(fs.readFileSync(new URL('../../app/lib/unicode/chars.json', import.meta.url), 'utf8'));
const out = chars.map((c) => ({ cp: c[0], name: c[1], codes: Object.fromEntries(codes(c[0], { entities: c[15], name: c[1] })) }));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(`${out.length} characters exported`);
