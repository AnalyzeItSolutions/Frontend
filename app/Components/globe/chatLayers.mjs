/**
 * Which live globe layers a question is about, so Chat can draw them on its globe when it helps.
 * Pure and dependency-free so Node's test runner can import it.
 */

const RULES = [
  ['earthquakes', /\b(earthquakes?|quakes?|seismic|tremors?|aftershocks?)\b/i],
  ['wildfires', /\b(wild\s?fires?|forest fires?|bush\s?fires?|burning)\b/i],
  ['storms', /\b(hurricanes?|cyclones?|typhoons?|storms?|tornad(?:o|oes))\b/i],
  ['volcanoes', /\b(volcano(?:es)?|eruptions?|erupting)\b/i],
  ['disasters', /\b(floods?|flooding|tsunamis?|droughts?|disasters?|landslides?)\b/i],
  ['air_quality', /\b(air quality|aqi|pollution|smog|pm\s?2\.?5)\b/i],
  ['weather', /\b(weather|temperatures?|heat\s?waves?|forecast|monsoon|rain(?:fall)?|snow|humidity)\b/i],
  ['space_weather', /\b(aurora|solar (?:flares?|storms?)|geomagnetic|space weather)\b/i],
  ['iss', /\b(iss|space station|satellites?)\b/i],
  // The chat globe draws pins on the GPU like the full globe, so any layer can answer a question.
  ['flights', /\b(flights?|aircraft|planes?|air traffic|airspace|aviation)\b/i],
  ['news_events', /\b(world news|news today|headlines?|in the news|unrest|protests?)\b/i],
  ['hotspots', /\b(fire hotspots?|active fires?|fires? (?:burning|today|now)|firms)\b/i],
  ['wind', /\b(winds?|jet stream|gusts?|breez(?:e|y))\b/i],
  ['orbits', /\b(all satellites|satellite constellations?|starlink|space debris)\b/i],
  ['ports', /\b(shipping|ports?|chokepoints?|suez|panama canal|hormuz|malacca|supply chain)\b/i],
  ['markets', /\b(stock markets?|stock exchange|market index|indices|sensex|nifty|nasdaq|nikkei)\b/i],
];

/**
 * @param {string} text
 * @param {number} [max]
 * @returns {string[]} layer ids, in the order a person would expect them, at most `max`
 */
export function inferGlobeLayers(text, max = 2) {
  const q = String(text || '');
  if (!q.trim()) return [];
  const found = [];
  for (const [id, re] of RULES) {
    if (re.test(q)) found.push(id);
    if (found.length >= max) break;
  }
  return found;
}
