// In-browser developer and data tools for /tools. Each tool is a pure run(values, mode) function plus its page text; the
// same function powers the page and the tests, and every example shown on a page is run by tools.test.mjs.
// Nothing here sends data anywhere.

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

// ---------- CSV (RFC 4180: quoted fields, doubled quotes, newlines inside quotes) ----------
export function parseCsv(text, delim = ',') {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch;
    } else if (ch === '"' && field === '') q = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (q) throw new Error('A quoted field is never closed.');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}
const csvCell = (v, delim = ',') => {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /["\n\r]/.test(s) || s.includes(delim) ? `"${s.replace(/"/g, '""')}"` : s;
};
const typed = (s) => (s === '' ? '' : /^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?$/.test(s) ? Number(s) : s === 'true' ? true : s === 'false' ? false : s);

// ---------- helpers ----------
const b64encode = (s) => { let bin = ''; for (const b of enc.encode(s)) bin += String.fromCharCode(b); return btoa(bin); };
const b64decode = (s) => {
  const clean = s.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  let bin;
  try { bin = atob(padded); } catch { throw new Error('This is not valid Base64.'); }
  try { return dec.decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); } catch { throw new Error('The decoded bytes are not valid UTF-8 text (it may be a binary file).'); }
};
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const splitWords = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').trim().split(/\s+/).filter(Boolean);
const num = (s, label) => { const n = Number(String(s).replace(/,/g, '').trim()); if (String(s).trim() === '' || !Number.isFinite(n)) throw new Error(`${label} must be a number.`); return n; };
const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString('en-US') : Number(n.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 10 }));

export const TOOLS = [
  {
    slug: 'json-formatter', name: 'JSON formatter and validator', category: 'Data',
    description: 'Format, minify or validate JSON in your browser, with the exact position of any syntax error.',
    answer: 'Paste JSON to pretty-print it with two-space indentation, minify it to one line, or check that it is valid. Errors show the line and column where parsing stopped.',
    fields: [{ key: 'input', label: 'JSON', type: 'textarea', default: '{"name":"AnalyzeIt","tags":["data","json"],"count":3}' }],
    modes: [{ id: 'format', label: 'Format' }, { id: 'minify', label: 'Minify' }, { id: 'validate', label: 'Validate' }],
    run({ input }, mode) {
      let v;
      try { v = JSON.parse(input); } catch (e) {
        const m = /position (\d+)/.exec(e.message);
        if (m) { const pos = Number(m[1]); const before = input.slice(0, pos); throw new Error(`Invalid JSON at line ${before.split('\n').length}, column ${pos - before.lastIndexOf('\n')}: ${e.message}`); }
        throw new Error(`Invalid JSON: ${e.message}`);
      }
      if (mode === 'minify') return JSON.stringify(v);
      if (mode === 'validate') return `Valid JSON: ${Array.isArray(v) ? `an array of ${v.length} items` : v === null ? 'null' : typeof v === 'object' ? `an object with ${Object.keys(v).length} keys` : `a ${typeof v}`}.`;
      return JSON.stringify(v, null, 2);
    },
    how: [
      'The text is read with the browser\'s own JSON parser, the same one JavaScript programs use, so "valid here" means valid for any standard JSON reader.',
      'JSON is stricter than JavaScript: keys need double quotes, strings cannot use single quotes, and a trailing comma after the last item is an error. Those three cause most failures.',
      'Formatting does not change values, but numbers larger than 2⁵³ lose precision in any JavaScript-based tool, including this one. Keep very large IDs as strings.',
    ],
    examples: [
      { values: { input: '{"a":1,"b":[true,null]}' }, mode: 'format', output: '{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}' },
      { values: { input: '{ "a" : 1 }' }, mode: 'minify', output: '{"a":1}' },
    ],
  },
  {
    slug: 'csv-to-json', name: 'CSV to JSON converter', category: 'Data',
    description: 'Convert CSV to a JSON array of objects, using the first row as keys. Handles quoted fields, commas and line breaks inside quotes.',
    answer: 'Paste CSV with a header row. Each following row becomes a JSON object whose keys are the header names. Numbers and true/false become JSON numbers and booleans.',
    fields: [{ key: 'input', label: 'CSV', type: 'textarea', default: 'name,city,orders\nAsha,Pune,12\n"Rao, K.",Chennai,7' }],
    modes: [{ id: ',', label: 'Comma' }, { id: ';', label: 'Semicolon' }, { id: '\t', label: 'Tab' }],
    run({ input }, mode = ',') {
      const rows = parseCsv(input, mode);
      if (rows.length < 2) throw new Error('Need a header row and at least one data row.');
      const [head, ...body] = rows;
      return JSON.stringify(body.map((r) => Object.fromEntries(head.map((h, i) => [h, typed(r[i] ?? '')]))), null, 2);
    },
    how: [
      'The parser follows RFC 4180, the usual CSV rules: a field in double quotes may contain commas and line breaks, and a doubled quote ("") inside quotes is a literal quote.',
      'Spreadsheets in many European locales export with semicolons because the comma is the decimal separator; pick Semicolon for those files.',
      'Values that look like numbers are converted, which changes "007" to 7. If leading zeros matter (postal codes, phone numbers), keep the output as strings.',
    ],
    examples: [{ values: { input: 'a,b\n1,"x, y"' }, mode: ',', output: '[\n  {\n    "a": 1,\n    "b": "x, y"\n  }\n]' }],
  },
  {
    slug: 'json-to-csv', name: 'JSON to CSV converter', category: 'Data',
    description: 'Turn a JSON array of objects into CSV for Excel or Google Sheets, with correct quoting.',
    answer: 'Paste a JSON array of objects. The columns are every key that appears in any object, in first-seen order; missing values become empty cells.',
    fields: [{ key: 'input', label: 'JSON array', type: 'textarea', default: '[{"name":"Asha","orders":12},{"name":"Rao, K.","orders":7,"city":"Chennai"}]' }],
    run({ input }) {
      let v;
      try { v = JSON.parse(input); } catch (e) { throw new Error(`Invalid JSON: ${e.message}`); }
      if (!Array.isArray(v) || !v.every((r) => r && typeof r === 'object' && !Array.isArray(r))) throw new Error('Expected an array of objects, like [{"a":1},{"a":2}].');
      const keys = [...new Set(v.flatMap((r) => Object.keys(r)))];
      return [keys.map((k) => csvCell(k)).join(','), ...v.map((r) => keys.map((k) => csvCell(r[k])).join(','))].join('\n');
    },
    how: [
      'Fields containing a comma, a quote or a line break are wrapped in double quotes, with inner quotes doubled, so Excel and Google Sheets read them back correctly.',
      'Nested objects and arrays are written as JSON text in a single cell. Flatten them first if you need separate columns.',
      'To open the result in Excel with non-English characters intact, save it as UTF-8 and use Data → From Text/CSV rather than double-clicking the file.',
    ],
    examples: [{ values: { input: '[{"a":1,"b":"x, y"},{"a":2}]' }, output: 'a,b\n1,"x, y"\n2,' }],
  },
  {
    slug: 'base64', name: 'Base64 encoder and decoder', category: 'Encoding',
    description: 'Encode text to Base64 or decode Base64 back to text, UTF-8 safe, including URL-safe Base64.',
    answer: 'Base64 writes any bytes using 64 printable characters (A–Z, a–z, 0–9, + and /), so binary data can travel through systems that only accept text. Every 3 bytes become 4 characters.',
    fields: [{ key: 'input', label: 'Text or Base64', type: 'textarea', default: 'Hello, नमस्ते 👋' }],
    modes: [{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }],
    run: ({ input }, mode) => (mode === 'decode' ? b64decode(input) : b64encode(input)),
    how: [
      'Text is first turned into UTF-8 bytes, then encoded. That is why non-English text and emoji work here, where the browser\'s plain btoa() would throw an error.',
      'Decoding accepts the URL-safe alphabet too (- and _ instead of + and /) and missing = padding, both common in JWTs and URLs.',
      'Base64 is an encoding, not encryption: anyone can decode it. It also makes data about a third larger.',
    ],
    examples: [
      { values: { input: 'Hello' }, mode: 'encode', output: 'SGVsbG8=' },
      { values: { input: 'w6k' }, mode: 'decode', output: 'é' },
    ],
  },
  {
    slug: 'url-encoder', name: 'URL encoder and decoder', category: 'Encoding',
    description: 'Percent-encode text for use in a URL query string, or decode %XX sequences back to text.',
    answer: 'URL encoding replaces characters that are not allowed or have a special meaning in URLs with % followed by their UTF-8 bytes in hex: a space becomes %20 and é becomes %C3%A9.',
    fields: [{ key: 'input', label: 'Text or encoded URL part', type: 'textarea', default: 'price < 500 & city = Pune' }],
    modes: [{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }],
    run({ input }, mode) {
      if (mode !== 'decode') return encodeURIComponent(input);
      try { return decodeURIComponent(input.replace(/\+/g, ' ')); } catch { throw new Error('Contains a % sequence that is not valid UTF-8.'); }
    },
    how: [
      'Encoding uses encodeURIComponent, which is right for one query value or path segment. It encodes /, ?, & and =, so do not run it over a whole URL.',
      'When decoding, + is read as a space, as HTML forms send it. In a path, a literal + is just a plus sign.',
    ],
    examples: [{ values: { input: 'a b&c' }, mode: 'encode', output: 'a%20b%26c' }, { values: { input: 'caf%C3%A9+au+lait' }, mode: 'decode', output: 'café au lait' }],
  },
  {
    slug: 'html-entities', name: 'HTML entity encoder and decoder', category: 'Encoding',
    description: 'Escape text so it shows literally in HTML (& < > " \'), or turn entities like &amp;eacute; back into characters.',
    answer: 'Escaping replaces the five characters that HTML treats as markup (&, <, >, " and \') with entities, so user text displays as text instead of being read as tags.',
    fields: [{ key: 'input', label: 'Text or HTML', type: 'textarea', default: '<b>"Fish & chips"</b>' }],
    modes: [{ id: 'encode', label: 'Escape' }, { id: 'decode', label: 'Unescape' }],
    run({ input }, mode) {
      if (mode !== 'decode') return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', copy: '©', reg: '®', euro: '€', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
      return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : named[e.toLowerCase()] ?? m));
    },
    how: [
      'Escaping these five characters is enough for text placed between tags or inside a quoted attribute. It is not enough inside a script, style or unquoted attribute; use your framework\'s escaping there.',
      'Unescaping handles numeric entities (&#233; and &#xE9;) and the most common named ones; the full list of over 2,000 names is on each character\'s page in the Unicode section.',
    ],
    examples: [{ values: { input: '<a href="x">' }, mode: 'encode', output: '&lt;a href=&quot;x&quot;&gt;' }, { values: { input: 'caf&eacute; &#x20AC;5' }, mode: 'decode', output: 'café €5' }],
  },
  {
    slug: 'unix-timestamp', name: 'Unix timestamp converter', category: 'Time',
    description: 'Convert a Unix timestamp (seconds or milliseconds since 1970) to a date in UTC and ISO 8601, or a date back to a timestamp.',
    answer: 'A Unix timestamp counts the seconds since 1 January 1970 00:00:00 UTC, ignoring leap seconds. Enter a number to get the date, or a date like 2026-10-22T09:30:00Z to get the number.',
    fields: [{ key: 'input', label: 'Timestamp or date', type: 'text', default: '1792656000' }],
    run({ input }) {
      const s = input.trim();
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        const n = Number(s);
        const ms = Math.abs(n) >= 1e11 ? n : n * 1000; // 13-digit values are milliseconds
        const d = new Date(ms);
        if (Number.isNaN(d.getTime())) throw new Error('Out of range.');
        return `${Math.abs(n) >= 1e11 ? 'Read as milliseconds.' : 'Read as seconds.'}\nUTC:      ${d.toUTCString()}\nISO 8601: ${d.toISOString()}\nSeconds:  ${Math.floor(ms / 1000)}\nMillis:   ${ms}`;
      }
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) throw new Error('Enter a number, or a date such as 2026-10-22T09:30:00Z.');
      return `Seconds:  ${Math.floor(d.getTime() / 1000)}\nMillis:   ${d.getTime()}\nISO 8601: ${d.toISOString()}${/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : '\nNo time zone was given, so it was read in your browser\'s time zone.'}`;
    },
    how: [
      'Ten-digit numbers are treated as seconds and thirteen-digit numbers as milliseconds, the two forms used by Unix tools and by JavaScript (Date.now()) respectively.',
      'A date written without a time zone is ambiguous. ISO dates ending in Z are UTC; a date-only string such as 2026-10-22 is also read as UTC midnight by JavaScript.',
      'Systems that store timestamps as signed 32-bit seconds overflow on 19 January 2038; 64-bit timestamps do not have that problem.',
    ],
    examples: [{ values: { input: '0' }, output: 'Read as seconds.\nUTC:      Thu, 01 Jan 1970 00:00:00 GMT\nISO 8601: 1970-01-01T00:00:00.000Z\nSeconds:  0\nMillis:   0' }, { values: { input: '2026-10-22T00:00:00Z' }, output: 'Seconds:  1792627200\nMillis:   1792627200000\nISO 8601: 2026-10-22T00:00:00.000Z' }],
  },
  {
    slug: 'number-base-converter', name: 'Binary, hex, octal and decimal converter', category: 'Numbers',
    description: 'Convert whole numbers between binary, octal, decimal and hexadecimal, of any size.',
    answer: 'Type a number with an optional 0b, 0o or 0x prefix (or pick its base) and see it in all four bases. Large numbers are exact because the conversion uses arbitrary-precision integers.',
    fields: [{ key: 'input', label: 'Number', type: 'text', default: '0xFF' }],
    modes: [{ id: 'auto', label: 'Detect from prefix' }, { id: '2', label: 'Binary' }, { id: '8', label: 'Octal' }, { id: '10', label: 'Decimal' }, { id: '16', label: 'Hex' }],
    run({ input }, mode = 'auto') {
      let s = input.trim().replace(/[_\s]/g, '').toLowerCase();
      const neg = s.startsWith('-'); if (neg) s = s.slice(1);
      let base = mode === 'auto' ? 10 : Number(mode);
      if (mode === 'auto') { if (s.startsWith('0x')) base = 16; else if (s.startsWith('0b')) base = 2; else if (s.startsWith('0o')) base = 8; }
      s = s.replace(/^0[xbo]/, '');
      const digits = '0123456789abcdef'.slice(0, base);
      if (!s || [...s].some((c) => !digits.includes(c))) throw new Error(`Not a valid base-${base} number.`);
      let v = 0n; for (const c of s) v = v * BigInt(base) + BigInt(digits.indexOf(c));
      if (neg) v = -v;
      const show = (b) => (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString(b);
      return `Decimal: ${show(10)}\nHex:     0x${show(16).toUpperCase().replace('-', '')}${v < 0n ? ' (negative)' : ''}\nOctal:   0o${show(8).replace('-', '')}\nBinary:  0b${show(2).replace('-', '')}\nBits:    ${(v < 0n ? -v : v).toString(2).length}`;
    },
    how: [
      'Each digit in base b is worth b times the digit to its right: 0xFF = 15 × 16 + 15 = 255.',
      'One hex digit is exactly four binary digits, which is why hex is the usual shorthand for bytes: 0xFF is 1111 1111.',
      'Negative numbers are shown with a minus sign, not in two\'s complement, because two\'s complement depends on the word size (8, 16, 32 or 64 bits).',
    ],
    examples: [{ values: { input: '0xFF' }, mode: 'auto', output: 'Decimal: 255\nHex:     0xFF\nOctal:   0o377\nBinary:  0b11111111\nBits:    8' }],
  },
  {
    slug: 'percentage-calculator', name: 'Percentage calculator', category: 'Numbers',
    description: 'Work out X% of a number, what percentage one number is of another, and the percentage change from one value to another.',
    answer: 'X% of Y is Y × X ÷ 100. A as a percentage of B is A ÷ B × 100. The percentage change from A to B is (B − A) ÷ A × 100.',
    fields: [{ key: 'a', label: 'A', type: 'text', default: '18' }, { key: 'b', label: 'B', type: 'text', default: '450' }],
    modes: [{ id: 'of', label: 'A% of B' }, { id: 'share', label: 'A is what % of B' }, { id: 'change', label: '% change from A to B' }],
    run({ a, b }, mode) {
      const x = num(a, 'A'), y = num(b, 'B');
      if (mode === 'share') { if (y === 0) throw new Error('B cannot be zero.'); return `${fmt(x)} is ${fmt((x / y) * 100)}% of ${fmt(y)}`; }
      if (mode === 'change') { if (x === 0) throw new Error('A percentage change from zero is undefined.'); const c = ((y - x) / Math.abs(x)) * 100; return `From ${fmt(x)} to ${fmt(y)} is ${c >= 0 ? 'an increase' : 'a decrease'} of ${fmt(Math.abs(c))}%`; }
      return `${fmt(x)}% of ${fmt(y)} is ${fmt((y * x) / 100)}`;
    },
    how: [
      'Percentage change and percentage points are different: a rate going from 4% to 5% is a rise of one percentage point but a 25% increase.',
      'Going up 50% and then down 50% does not get you back where you started: 100 → 150 → 75. Percentage changes multiply; they do not add.',
      'For a change over several years, the compound annual growth rate is the fairer average; see the CAGR calculator.',
    ],
    examples: [{ values: { a: '18', b: '450' }, mode: 'of', output: '18% of 450 is 81' }, { values: { a: '80', b: '100' }, mode: 'change', output: 'From 80 to 100 is an increase of 25%' }],
  },
  {
    slug: 'cagr-calculator', name: 'CAGR calculator', category: 'Numbers',
    description: 'Compound annual growth rate from a start value, an end value and the number of years between them.',
    answer: 'CAGR = (End ÷ Start)^(1 ÷ Years) − 1. It is the steady yearly growth rate that would take the start value to the end value over that many years.',
    fields: [{ key: 'start', label: 'Start value', type: 'text', default: '100000' }, { key: 'end', label: 'End value', type: 'text', default: '250000' }, { key: 'years', label: 'Years', type: 'text', default: '5' }],
    run({ start, end, years }) {
      const s = num(start, 'Start'), e = num(end, 'End'), n = num(years, 'Years');
      if (s <= 0 || e <= 0) throw new Error('Start and end must both be positive; CAGR is undefined across zero or negative values.');
      if (n <= 0) throw new Error('Years must be more than zero.');
      const r = Math.pow(e / s, 1 / n) - 1;
      return `CAGR: ${(r * 100).toFixed(2)}% a year\nTotal growth: ${fmt(((e - s) / s) * 100)}% over ${fmt(n)} years`;
    },
    how: [
      'Years is the number of years between the two values, not the number of values: 2020 to 2025 is 5 years.',
      'CAGR ignores the path in between. A business that grew, crashed and recovered can show the same CAGR as one that grew smoothly.',
      'Averaging yearly growth rates overstates growth when they vary; CAGR is the honest single number.',
    ],
    examples: [{ values: { start: '100', end: '200', years: '5' }, output: 'CAGR: 14.87% a year\nTotal growth: 100% over 5 years' }],
  },
  {
    slug: 'word-counter', name: 'Word and character counter', category: 'Text',
    description: 'Count words, characters (with and without spaces), lines, UTF-8 bytes and estimated reading time.',
    answer: 'Paste text to count its words, characters, lines and bytes. Characters are counted as people see them, so an emoji or an accented letter counts as one.',
    fields: [{ key: 'input', label: 'Text', type: 'textarea', default: 'Numbers come from code, not guesses. Ask a question about your data and check the answer.' }],
    run({ input }) {
      const chars = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input)].length;
      const w = words(input).length;
      return `Words: ${w}\nCharacters: ${chars}\nCharacters without spaces: ${[...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input.replace(/\s/g, ''))].length}\nLines: ${input === '' ? 0 : input.split(/\r\n|\r|\n/).length}\nUTF-8 bytes: ${enc.encode(input).length}\nReading time: about ${Math.max(1, Math.round(w / 230))} min at 230 words a minute`;
    },
    how: [
      'Words are runs of non-space characters, which matches most word processors for English. Languages written without spaces, such as Chinese or Thai, are undercounted.',
      'Characters are counted as grapheme clusters: 👍🏽 is one character even though it is two code points and eight UTF-8 bytes. String.length in JavaScript would say 4.',
      'Byte count matters for limits set in bytes, such as database column sizes and some SMS and API limits.',
    ],
    examples: [{ values: { input: 'héllo world 👍🏽' }, output: 'Words: 3\nCharacters: 13\nCharacters without spaces: 11\nLines: 1\nUTF-8 bytes: 21\nReading time: about 1 min at 230 words a minute' }],
  },
  {
    slug: 'case-converter', name: 'Case converter', category: 'Text',
    description: 'Convert text to UPPER, lower, Title Case, camelCase, PascalCase, snake_case, kebab-case or CONSTANT_CASE.',
    answer: 'Paste words or an identifier in any style; the converter splits it into words (at spaces, underscores, hyphens and lower-to-upper changes) and joins them in the style you pick.',
    fields: [{ key: 'input', label: 'Text', type: 'textarea', default: 'monthly revenue per customer' }],
    modes: ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'upper', 'lower'].map((id) => ({ id, label: { camel: 'camelCase', pascal: 'PascalCase', snake: 'snake_case', kebab: 'kebab-case', constant: 'CONSTANT_CASE', title: 'Title Case', upper: 'UPPER', lower: 'lower' }[id] })),
    run({ input }, mode = 'camel') {
      if (mode === 'upper') return input.toUpperCase();
      if (mode === 'lower') return input.toLowerCase();
      return input.split('\n').map((line) => {
        const w = splitWords(line).map((x) => x.toLowerCase());
        const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
        return { camel: w.map((x, i) => (i ? cap(x) : x)).join(''), pascal: w.map(cap).join(''), snake: w.join('_'), kebab: w.join('-'), constant: w.join('_').toUpperCase(), title: w.map(cap).join(' ') }[mode];
      }).join('\n');
    },
    how: [
      'camelCase is the convention for JavaScript and Java variables, PascalCase for class names, snake_case for Python and SQL columns, kebab-case for URLs and CSS, and CONSTANT_CASE for constants.',
      'Words are split where lower case meets upper case, so "parseHTTPResponse" becomes parse + httpresponse: there is no such change between HTTP and Response. Check acronym-heavy names by eye.',
    ],
    examples: [{ values: { input: 'monthly revenue per customer' }, mode: 'snake', output: 'monthly_revenue_per_customer' }, { values: { input: 'orderTotal_inr' }, mode: 'kebab', output: 'order-total-inr' }],
  },
  {
    slug: 'jwt-decoder', name: 'JWT decoder', category: 'Encoding',
    description: 'Decode a JSON Web Token to read its header and payload, with expiry times shown as dates. Does not verify the signature.',
    answer: 'A JWT is three Base64URL parts separated by dots: a header, a payload of claims, and a signature. This shows the first two as JSON. Anyone can read them; only the signature proves who issued the token.',
    fields: [{ key: 'input', label: 'JWT', type: 'textarea', default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkFzaGEiLCJleHAiOjE3OTI2NTYwMDB9.signature' }],
    run({ input }) {
      const parts = input.trim().split('.');
      if (parts.length !== 3) throw new Error('A JWT has three parts separated by dots.');
      const part = (s, label) => { try { return JSON.parse(b64decode(s)); } catch { throw new Error(`The ${label} is not Base64URL-encoded JSON.`); } };
      const header = part(parts[0], 'header'), payload = part(parts[1], 'payload');
      const times = ['exp', 'iat', 'nbf'].filter((k) => typeof payload[k] === 'number').map((k) => `${k}: ${new Date(payload[k] * 1000).toISOString()}`);
      return `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}${times.length ? `\n\n${times.join('\n')}` : ''}\n\nSignature not verified.`;
    },
    how: [
      'Decoding happens in your browser; the token is not sent anywhere. Still, treat real tokens like passwords: anyone holding one can use it until it expires.',
      'exp, iat and nbf are Unix timestamps in seconds (expiry, issued-at and not-before); they are shown as ISO dates in UTC.',
      'Checking the signature needs the issuer\'s secret or public key, which a page like this should never ask for.',
    ],
    examples: [{ values: { input: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwiZXhwIjowfQ.x' }, output: 'Header:\n{\n  "alg": "none"\n}\n\nPayload:\n{\n  "sub": "1",\n  "exp": 0\n}\n\nexp: 1970-01-01T00:00:00.000Z\n\nSignature not verified.' }],
  },
  {
    slug: 'hash-generator', name: 'SHA-256 hash generator', category: 'Encoding',
    description: 'Compute SHA-1, SHA-256, SHA-384 or SHA-512 hashes of text in your browser, as hex.',
    answer: 'A hash function turns any text into a fixed-length fingerprint. The same input always gives the same hash, and any change to the input changes it completely. Text is hashed as UTF-8.',
    fields: [{ key: 'input', label: 'Text', type: 'textarea', default: 'hello' }],
    modes: [{ id: 'SHA-256', label: 'SHA-256' }, { id: 'SHA-1', label: 'SHA-1' }, { id: 'SHA-384', label: 'SHA-384' }, { id: 'SHA-512', label: 'SHA-512' }],
    async run({ input }, mode = 'SHA-256') {
      const buf = await crypto.subtle.digest(mode, enc.encode(input));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    },
    how: [
      'Hashing uses the browser\'s Web Crypto API. A trailing newline or space changes the hash, which is the usual reason two "identical" hashes differ.',
      'SHA-1 is broken for security uses (collisions have been produced) but is still used for checksums and Git object IDs. Use SHA-256 or better for anything security-related.',
      'Do not store passwords as plain SHA hashes; use a slow password hash such as bcrypt, scrypt or Argon2.',
    ],
    examples: [{ values: { input: 'hello' }, mode: 'SHA-256', output: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824' }, { values: { input: '' }, mode: 'SHA-1', output: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' }],
  },
  {
    slug: 'uuid-generator', name: 'UUID generator', category: 'Encoding',
    description: 'Generate random version 4 UUIDs, one or many at a time, using the browser\'s cryptographic random generator.',
    answer: 'A version 4 UUID is 128 bits, 122 of them random, written as 32 hex digits in the pattern 8-4-4-4-12. The chance of two random v4 UUIDs colliding is negligible for any practical number.',
    fields: [{ key: 'count', label: 'How many (1–100)', type: 'text', default: '5' }],
    run({ count }) {
      const n = num(count, 'How many');
      if (n < 1 || n > 100 || !Number.isInteger(n)) throw new Error('Choose a whole number from 1 to 100.');
      return Array.from({ length: n }, () => crypto.randomUUID()).join('\n');
    },
    how: [
      'UUIDs come from crypto.randomUUID(), which uses a cryptographically secure random source. Nothing is stored or sent.',
      'Random v4 UUIDs scatter inserts across a database index. For primary keys, version 7 UUIDs, which start with a timestamp, keep inserts in order.',
    ],
    examples: [],
  },
  {
    slug: 'regex-tester', name: 'Regex tester', category: 'Text',
    description: 'Test a JavaScript regular expression against text and see every match with its position and capture groups.',
    answer: 'Enter a pattern and flags (g, i, m, s, u) and the text to search. Each match is listed with its index and any capture groups. The syntax is JavaScript\'s, which is close to but not the same as Python\'s or PCRE.',
    fields: [{ key: 'pattern', label: 'Pattern', type: 'text', default: '(\\w+)@(\\w+)\\.com' }, { key: 'flags', label: 'Flags', type: 'text', default: 'g' }, { key: 'input', label: 'Text', type: 'textarea', default: 'Write to asha@example.com or rao@shop.com.' }],
    run({ pattern, flags, input }) {
      let re;
      try { re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`); } catch (e) { throw new Error(`Invalid pattern: ${e.message}`); }
      const out = [];
      for (const m of input.matchAll(re)) {
        out.push(`Match ${out.length + 1} at ${m.index}: ${JSON.stringify(m[0])}${m.length > 1 ? `\n  groups: ${m.slice(1).map((g, i) => `$${i + 1}=${JSON.stringify(g ?? null)}`).join(', ')}` : ''}`);
        if (out.length >= 500) { out.push('Stopped after 500 matches.'); break; }
        if (!flags.includes('g')) break;
      }
      return out.length ? out.join('\n') : 'No matches.';
    },
    how: [
      'The tester runs your pattern with the browser\'s own regular expression engine, so results match what the same pattern does in JavaScript and TypeScript.',
      'Without the g flag only the first match is shown. Add m to make ^ and $ match at every line, s to let . match line breaks, and u for full Unicode.',
      'Patterns with nested repeats such as (a+)+ can take exponential time on some inputs; avoid them in code that handles user input.',
    ],
    examples: [{ values: { pattern: '(\\d+)-(\\d+)', flags: 'g', input: 'pages 10-12 and 40-45' }, output: 'Match 1 at 6: "10-12"\n  groups: $1="10", $2="12"\nMatch 2 at 16: "40-45"\n  groups: $1="40", $2="45"' }],
  },
  {
    slug: 'color-converter', name: 'Color converter: HEX, RGB and HSL', category: 'Design',
    description: 'Convert a colour between HEX, RGB and HSL, and check its contrast ratio against white and black text.',
    answer: 'Enter a colour as #RRGGBB, #RGB, rgb(r, g, b) or hsl(h, s%, l%) to see it in the other two formats, plus its WCAG contrast ratio with white and with black.',
    fields: [{ key: 'input', label: 'Colour', type: 'text', default: '#1f6feb' }],
    run({ input }) {
      const s = input.trim().toLowerCase();
      let r, g, b;
      let m;
      if ((m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s))) { const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]; [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
      else if ((m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(s))) [r, g, b] = m.slice(1).map(Number);
      else if ((m = /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/.exec(s))) {
        const [h, sa, l] = [Number(m[1]) % 360, Number(m[2]) / 100, Number(m[3]) / 100];
        const k = (n) => (n + h / 30) % 12, a = sa * Math.min(l, 1 - l);
        [r, g, b] = [0, 8, 4].map((n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))));
      } else throw new Error('Use #RRGGBB, #RGB, rgb(r, g, b) or hsl(h, s%, l%).');
      if ([r, g, b].some((v) => v > 255)) throw new Error('RGB values go from 0 to 255.');
      const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255, l = (max + min) / 2, d = max - min;
      const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = 0;
      if (d) { const [R, G, B] = [r / 255, g / 255, b / 255]; h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4; h = Math.round(h * 60); if (h < 0) h += 360; }
      const lin = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, c) => ((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)).toFixed(2);
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
      return `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)\nContrast with white: ${ratio(lum, 1)}:1\nContrast with black: ${ratio(lum, 0)}:1`;
    },
    how: [
      'HEX and RGB describe the same thing, red, green and blue from 0 to 255; HSL describes hue (0–360°), saturation and lightness, which is easier to adjust by hand.',
      'Contrast ratios use the WCAG 2 formula. Normal text needs at least 4.5:1 and large text 3:1 to meet level AA.',
      'HSL values are rounded to whole numbers, so converting back can be off by one in an RGB channel.',
    ],
    examples: [{ values: { input: '#ffffff' }, output: 'HEX: #FFFFFF\nRGB: rgb(255, 255, 255)\nHSL: hsl(0, 0%, 100%)\nContrast with white: 1.00:1\nContrast with black: 21.00:1' }, { values: { input: 'rgb(255, 0, 0)' }, output: 'HEX: #FF0000\nRGB: rgb(255, 0, 0)\nHSL: hsl(0, 100%, 50%)\nContrast with white: 4.00:1\nContrast with black: 5.25:1' }],
  },
];

export const tool = (slug) => TOOLS.find((t) => t.slug === slug);
export const TOOL_CATEGORIES = [...new Set(TOOLS.map((t) => t.category))];
