import cellsJson from './cells.json';
import defsJson from './defs.json';
import metaJson from './meta.json';

// World Development Indicators behind /data and /indicators. The index (built by scripts/seo/build_wdi_index.py from the
// World Bank bulk download) says which country x indicator pairs have enough data for a page; the series itself is fetched
// from the World Bank API on first render and cached, so every figure on a page comes from the source.

type CountryRow = [iso3: string, name: string, slug: string, region: string | null, income: string | null, aggregate: 0 | 1, iso2: string | null];
type IndicatorRow = [id: string, name: string, slug: string, topic: string, source: string];
export type Cell = [country: number, obs: number, first: number, last: number, lastValue: number];

export type Country = { iso3: string; name: string; slug: string; region: string | null; income: string | null; aggregate: boolean; iso2: string | null; index: number };
export type Indicator = { id: string; name: string; slug: string; topic: string; source: string };
export type Definition = { def: string; unit: string; agg: string; limits: string };
export type Point = { year: number; value: number | null };

const meta = metaJson as unknown as { latest_year: number; pages: number; min_obs: number; min_last_year: number; countries: CountryRow[]; indicators: IndicatorRow[] };
const cells = cellsJson as unknown as Record<string, Cell[]>;
const defs = defsJson as unknown as Record<string, Definition>;

export const WDI_REVALIDATE = 60 * 60 * 24 * 30; // the WDI is updated a few times a year
export const WDI_PAGES = meta.pages;
export const WDI_LATEST_YEAR = meta.latest_year;
export const WDI_MIN_OBS = meta.min_obs;
// Google allows 50,000 URLs per sitemap file; sitemap 0 holds the hubs and rankings, the rest the country pages.
export const DATA_SITEMAP_PER = 45000;
export const DATA_SITEMAP_COUNT = 1 + Math.ceil(meta.pages / DATA_SITEMAP_PER);

export const COUNTRIES: Country[] = meta.countries.map(([iso3, name, slug, region, income, aggregate, iso2], index) => ({ iso3, name, slug, region, income, aggregate: aggregate === 1, iso2, index }));
export const INDICATORS: Indicator[] = meta.indicators.map(([id, name, slug, topic, source]) => ({ id, name, slug, topic, source }));
const countryBySlug = new Map(COUNTRIES.map((c) => [c.slug, c]));
const countryByIso3 = new Map(COUNTRIES.map((c) => [c.iso3, c]));
const indicatorBySlug = new Map(INDICATORS.map((i) => [i.slug, i]));
const cellIndex = new Map<string, Map<number, Cell>>(Object.entries(cells).map(([id, cs]) => [id, new Map(cs.map((c) => [c[0], c]))]));

export const country = (slug: string) => countryBySlug.get(slug);
export const countryIso3 = (iso3: string | null | undefined) => (iso3 ? countryByIso3.get(iso3) : undefined);
export const indicator = (slug: string) => indicatorBySlug.get(slug);
export const definition = (id: string): Definition => defs[id] ?? { def: '', unit: '', agg: '', limits: '' };
export const cell = (ind: Indicator, c: Country) => cellIndex.get(ind.id)?.get(c.index);
export const cellsFor = (ind: Indicator) => (cells[ind.id] ?? []).map((c) => ({ cell: c, country: COUNTRIES[c[0]] }));
export const indicatorsFor = (c: Country) => INDICATORS.filter((i) => cellIndex.get(i.id)?.has(c.index)).map((i) => ({ indicator: i, cell: cell(i, c)! }));
export const TOPICS = [...new Set(INDICATORS.map((i) => i.topic))].sort();

/** Every country x indicator page, in a stable order (by indicator, then country), for the split sitemaps. */
export function* allPairs(): Generator<[Country, Indicator, Cell]> {
  for (const ind of INDICATORS) for (const c of cells[ind.id] ?? []) yield [COUNTRIES[c[0]], ind, c];
}

/** The yearly series for one economy, straight from the World Bank API, oldest first. */
export async function fetchSeries(c: Country, ind: Indicator): Promise<Point[]> {
  const url = `https://api.worldbank.org/v2/country/${c.iso3}/indicator/${ind.id}?format=json&per_page=200&source=2`;
  const res = await fetch(url, { next: { revalidate: WDI_REVALIDATE } });
  if (!res.ok) throw new Error(`World Bank API ${res.status} for ${c.iso3}/${ind.id}`);
  const body = (await res.json()) as [unknown, { date: string; value: number | null }[] | null];
  const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : [];
  if (!rows.length) throw new Error(`World Bank API returned no rows for ${c.iso3}/${ind.id}`);
  const pts = rows.map((r) => ({ year: Number(r.date), value: r.value == null ? null : Number(r.value) })).filter((p) => Number.isFinite(p.year)).sort((a, b) => a.year - b.year);
  // Trim empty years at both ends so the chart and table start and stop where the data does.
  const first = pts.findIndex((p) => p.value != null);
  let last = pts.length - 1;
  while (last >= 0 && pts[last].value == null) last--;
  return first < 0 ? [] : pts.slice(first, last + 1);
}

export const sourceUrl = (c: Country, ind: Indicator) => `https://data.worldbank.org/indicator/${ind.id}${c.iso2 ? `?locations=${c.iso2}` : ''}`;
export const apiUrl = (c: Country, ind: Indicator) => `https://api.worldbank.org/v2/country/${c.iso3}/indicator/${ind.id}?format=json&per_page=200&source=2`;
