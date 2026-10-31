// Checks that every external reference link used by the link graph still resolves (HTTP 200 after redirects).
// Run by hand before changing app/lib/links/graph.mjs: node scripts/seo/check_external_links.mjs
import { METHOD_REFS, NIST_HANDBOOK } from '../../app/lib/links/graph.mjs';

const urls = [...new Set([...Object.values(METHOD_REFS).flat().map((r) => r[1]), NIST_HANDBOOK[1]])];
let bad = 0;
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'AnalyzeIt link check (+https://www.analyzeit.si)' } });
    if (res.status !== 200) { bad++; console.log(`${res.status} ${url}`); }
  } catch (e) { bad++; console.log(`ERR ${url} ${e.message}`); }
}
console.log(`${urls.length} links checked, ${bad} problems`);
process.exit(bad ? 1 : 0);
