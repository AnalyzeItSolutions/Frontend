// Search-result titles and descriptions for the programmatic pages.
// Google cuts titles at about 60 characters and already shows the site name next to the URL, so the answer
// (the value, the conversion, "copy and paste") goes first and the brand is added only when it still fits.
// Every figure here comes from the same index the page renders from; nothing is typed in.

export const TITLE_MAX = 60;
export const DESC_MAX = 160;
const BRAND = ' — AnalyzeIt';

/** The first candidate that fits, else the last one cut at a word with an ellipsis. */
export function fit(candidates, max) {
  const list = candidates.filter(Boolean);
  for (const c of list) if (c.length <= max) return c;
  const last = list[list.length - 1];
  const cut = last.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,:;(–-]+$/, '')}…`;
}

/** Adds the brand when it fits; a cut title is worse than a missing brand. */
export const withBrand = (title, max = TITLE_MAX) => (title.length + BRAND.length <= max ? `${title}${BRAND}` : title);

const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
// World Bank style "Population, total" reads as "total population" in a sentence.
const inSentence = (name) => {
  const m = name.match(/^(.+), total(\s*\([^)]*\))?$/);
  return m ? `total ${lowerFirst(m[1])}${m[2] ?? ''}` : lowerFirst(name);
};
const dropUnit = (name) => name.replace(/\s*\([^)]*\)\s*$/, '');
const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/**
 * /data/<country>/<indicator>: "India GDP growth (annual %): 6.5% (2024)".
 * Most World Bank names are too long for that; cutting them would give thousands of pages the same title, so
 * those lead with country, year and value and keep the full name after it (Google cuts the display, not the match).
 */
export function dataSnippet({ country, indicator, value, year, first, obs, rank }) {
  const short = dataTitle(country, indicator, value, year);
  const title = short
    ? fit([`${short}, ${first}–${year} data`, short], TITLE_MAX)
    : `${country}, ${year}: ${value} — ${indicator}`;
  const shortName = dropUnit(indicator);
  const ranked = rank ? `, the ${rank.rank === 1 ? '' : `${ordinal(rank.rank)} `}highest of ${rank.of} economies` : '';
  const lower = inSentence(indicator);
  const description = fit(
    [
      `${country}'s ${lower} was ${value} in ${year}${ranked}. ${obs} years of World Bank data (${first}–${year}) with a chart, yearly table and comparisons.`,
      `${country}'s ${lower} was ${value} in ${year}${ranked}. World Bank data ${first}–${year}, with chart and table.`,
      `${country}: ${shortName} was ${value} in ${year}${ranked}. World Bank data, ${first}–${year}.`,
      `${country}: ${shortName} was ${value} in ${year}. World Bank data, ${first}–${year}.`,
    ],
    DESC_MAX,
  );
  return { title, description };
}

function dataTitle(country, indicator, value, year) {
  const full = `${country} ${indicator}: ${value} (${year})`;
  return full.length <= TITLE_MAX ? full : null;
}

/** /indicators/<indicator>: a ranking page, so say "by country", the year and the count. */
export function indicatorSnippet({ indicator, year, economies }) {
  const short = dropUnit(indicator);
  const title = withBrand(
    fit([`${indicator} by country, ${year} ranking`, `${short} by country, ${year} ranking`, `${short} by country (${year})`], TITLE_MAX),
  );
  const description = fit(
    [
      `${indicator}: ${economies} economies ranked by the latest World Bank figures (${year}), with each country's yearly history and the official definition.`,
      `${short}: ${economies} economies ranked by the latest World Bank figures (${year}), with yearly history and the definition.`,
    ],
    DESC_MAX,
  );
  return { title, description };
}

/** /data/<country>: the country hub. */
export function countrySnippet({ country, indicators }) {
  const n = indicators.toLocaleString('en-US');
  return {
    title: withBrand(fit([`${country} statistics: ${n} World Bank indicators`, `${country} statistics`], TITLE_MAX)),
    description: fit(
      [
        `${country} statistics from the World Bank: GDP, population, health, education, environment and trade. ${n} indicators, each with yearly history and a ranking.`,
        `${country} statistics from the World Bank: ${n} indicators, each with yearly history and a ranking.`,
      ],
      DESC_MAX,
    ),
  };
}

/** /unicode/<char>: people search to copy the symbol or get its code. */
export function unicodeSnippet({ glyph, name, uplus, html, bytes, emoji }) {
  const g = glyph ? `${glyph} ` : '';
  const title = glyph
    ? fit(
        [
          `${g}${name} (${uplus}): copy and paste, HTML code`,
          `${g}${name} (${uplus}): copy and paste`,
          `${g}${name}: copy and paste`,
          `${g}${name}`,
        ],
        TITLE_MAX,
      )
    : fit([`${name} (${uplus}): HTML code and UTF-8`, `${name} (${uplus})`, name], TITLE_MAX);
  const what = emoji ? 'emoji' : 'character';
  const description = fit(
    glyph
      ? [
          `Copy ${glyph} (${name}, ${uplus}) in one click. HTML ${html}, UTF-8 ${bytes}, and the ${what}'s code for CSS, JavaScript and Python.`,
          `Copy ${glyph} (${name}, ${uplus}) in one click. HTML ${html}, UTF-8 ${bytes}, plus CSS, JavaScript and Python codes.`,
          `Copy ${glyph} (${uplus}) in one click. HTML ${html}, UTF-8 ${bytes}, plus CSS, JavaScript and Python codes.`,
        ]
      : [
          `The ${what} ${name} (${uplus}): HTML ${html}, UTF-8 ${bytes}, and its code in CSS, JavaScript, Python and more.`,
          `${name} (${uplus}): HTML ${html}, UTF-8 ${bytes}, plus CSS, JavaScript and Python codes.`,
        ],
    DESC_MAX,
  );
  return { title, description };
}

/** /convert/<pair>: the answer to "1 X in Y" is the title itself. */
export function convertSnippet({ fromPlural, toPlural, fromSymbol, toSymbol, fromName, toWord, one }) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const eq = `1 ${fromSymbol} = ${one} ${toSymbol}`;
  const title = fit(
    [
      `${cap(fromPlural)} to ${toPlural} (${fromSymbol} to ${toSymbol}): ${eq}`,
      `${cap(fromPlural)} to ${toPlural}: ${eq}`,
      `${fromSymbol} to ${toSymbol}: ${eq}`,
    ],
    TITLE_MAX,
  );
  const description = fit(
    [
      `1 ${fromName} = ${one} ${toWord}. Convert ${fromPlural} to ${toPlural} with the exact formula, a calculator and a conversion table.`,
      `1 ${fromName} = ${one} ${toWord}. Exact formula, calculator and conversion table.`,
    ],
    DESC_MAX,
  );
  return { title, description };
}
