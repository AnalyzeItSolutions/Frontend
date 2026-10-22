// How one code point is written in each encoding and language. Pure functions: scripts/seo/verify_unicode.py checks every
// character's output against Python's own encoders before a release.

const hex = (n, w = 4) => n.toString(16).toUpperCase().padStart(w, '0');

export const uPlus = (cp) => `U+${hex(cp)}`;

export function utf8(cp) {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 63)];
  if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
}

export function utf16(cp) {
  if (cp < 0x10000) return [cp];
  const v = cp - 0x10000;
  return [0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff)];
}

/**
 * The HTML Standard makes a numeric reference to NULL, to carriage return or to any control other than tab, line feed and
 * form feed a parse error; most of &#128;–&#159; are also read as Windows-1252 characters instead.
 */
export const htmlRefWorks = (cp) => !(cp === 0 || (cp < 0x20 && ![9, 10, 12].includes(cp)) || (cp >= 0x7f && cp <= 0x9f));

const bytesHex = (bs) => bs.map((b) => hex(b, 2)).join(' ');

/** Every representation shown in the "Codes" table, in display order. */
export function codes(cp, { entities = null, name = null } = {}) {
  const u8 = utf8(cp), u16 = utf16(cp);
  const js16 = u16.map((u) => `\\u${hex(u)}`).join('');
  const rows = [
    ['Code point', uPlus(cp)],
    ['Decimal', String(cp)],
    ['UTF-8 bytes', bytesHex(u8)],
    ['UTF-16 (big-endian)', u16.map((u) => hex(u)).join(' ')],
    ['UTF-32', hex(cp, 8)],
    ...(htmlRefWorks(cp) ? [['HTML decimal', `&#${cp};`], ['HTML hex', `&#x${hex(cp, 1)};`]] : [['HTML', 'not valid in HTML (a numeric reference to it is a parse error)']]),
    ...(entities?.length ? [['HTML named', entities.join(' ')]] : []),
    ['CSS', `\\${hex(cp, 1)}`],
    ['JavaScript', cp < 0x10000 ? js16 : `\\u{${hex(cp, 1)}} or ${js16}`],
    ['JSON', js16],
    ['Python', cp < 0x10000 ? `\\u${hex(cp)}` : `\\U${hex(cp, 8)}`],
    ...(name && !/^[A-Z][a-z]/.test(name) ? [['Python by name', `\\N{${name}}`]] : []),
    ['Java, C#', js16],
    ['Rust, Swift', `\\u{${hex(cp, 1)}}`],
    ['Go, C, C++', cp < 0x10000 ? `\\u${hex(cp)}` : `\\U${hex(cp, 8)}`],
    ['URL (percent-encoded)', u8.map((b) => `%${hex(b, 2)}`).join('')],
  ];
  return rows;
}

export const GENERAL_CATEGORY = {
  Lu: 'Uppercase letter', Ll: 'Lowercase letter', Lt: 'Titlecase letter', Lm: 'Modifier letter', Lo: 'Other letter',
  Mn: 'Non-spacing mark', Mc: 'Spacing mark', Me: 'Enclosing mark',
  Nd: 'Decimal digit', Nl: 'Letter number', No: 'Other number',
  Pc: 'Connector punctuation', Pd: 'Dash punctuation', Ps: 'Opening punctuation', Pe: 'Closing punctuation', Pi: 'Initial quote', Pf: 'Final quote', Po: 'Other punctuation',
  Sm: 'Math symbol', Sc: 'Currency symbol', Sk: 'Modifier symbol', So: 'Other symbol',
  Zs: 'Space separator', Zl: 'Line separator', Zp: 'Paragraph separator',
  Cc: 'Control character', Cf: 'Format character', Cn: 'Unassigned',
};

export const BIDI = {
  L: 'Left-to-right', R: 'Right-to-left', AL: 'Right-to-left (Arabic)', EN: 'European number', ES: 'European number separator', ET: 'European number terminator',
  AN: 'Arabic number', CS: 'Common number separator', NSM: 'Non-spacing mark', BN: 'Boundary neutral', B: 'Paragraph separator', S: 'Segment separator',
  WS: 'Whitespace', ON: 'Other neutral', LRE: 'Left-to-right embedding', LRO: 'Left-to-right override', RLE: 'Right-to-left embedding', RLO: 'Right-to-left override',
  PDF: 'Pop directional format', LRI: 'Left-to-right isolate', RLI: 'Right-to-left isolate', FSI: 'First strong isolate', PDI: 'Pop directional isolate',
};

/** Whether a character shows on its own (letters, symbols) rather than being invisible or combining. */
export const isVisible = (gc) => !/^(C|Z|M)/.test(gc);

/** Title Case for a Unicode name: LATIN SMALL LETTER E WITH ACUTE → Latin Small Letter E With Acute. */
export const titleCase = (name) => name.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

/** Parse a decomposition field ("<compat> 0020 0301" or "0065 0301"). */
export function decomposition(field) {
  if (!field) return null;
  const m = field.match(/^<(\w+)>\s*(.*)$/);
  const tag = m ? m[1] : null;
  const cps = (m ? m[2] : field).trim().split(/\s+/).map((h) => parseInt(h, 16));
  return { canonical: !tag, tag, cps };
}

export const scriptName = (s) => (s ? s.replace(/_/g, ' ') : null);
