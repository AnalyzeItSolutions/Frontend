/**
 * Pure helpers for "Ask the globe": what the model is told about the current view, and the starter questions.
 * Kept free of React so Node's test runner can import it.
 */

import { globeAskPrompt } from './dataQuality.mjs';

const LAYER_LABELS = {
  earthquakes: 'Earthquakes',
  disasters: 'Disasters',
  wildfires: 'Wildfires',
  storms: 'Storms',
  volcanoes: 'Volcanoes',
  weather: 'Weather',
  air_quality: 'Air quality',
  markets: 'Markets',
  iss: 'Satellites',
  space_weather: 'Space weather',
  radar: 'Rain radar',
  clouds: 'Live clouds',
  my_data: 'My data',
  fireballs: 'Fireballs',
  aurora_oval: 'Aurora oval',
  ocean: 'Ocean buoys',
  weather_alerts: 'Severe weather alerts',
  flights: 'Flights',
  orbits: 'All satellites',
  hotspots: 'Fire hotspots',
  news_events: 'News events',
  ports: 'Ports and chokepoints',
  wind: 'Wind',
};

const placeName = (p) => String(p?.name || '').trim() || `${Number(p?.lat).toFixed(2)}, ${Number(p?.lon).toFixed(2)}`;

/** Layers that are on and actually have something on the map, with counts. */
export function activeLayerSummary(layers, layerCounts) {
  const out = [];
  for (const [id, label] of Object.entries(LAYER_LABELS)) {
    if (!layers?.[id]) continue;
    const n = Number(layerCounts?.[id]);
    if (Number.isFinite(n) && n > 0) out.push({ id, label, count: n });
  }
  return out;
}

/**
 * The full message sent to the agent: the user's question, the pinned places, and a short factual
 * description of the view so "what's happening here?" is answerable without the user re-typing it.
 */
export function globeAskMessage(question, state = {}) {
  const places = [];
  if (state.selected) places.push(state.selected);
  for (const p of state.compare || []) {
    if (!places.some((q) => q.lat === p.lat && q.lon === p.lon)) places.push(p);
  }
  const base = globeAskPrompt(String(question || '').trim() || 'What should I look at on this globe?', places);
  const layers = activeLayerSummary(state.layers, state.layerCounts);
  const lines = [];
  if (layers.length) {
    lines.push(`Layers on the map: ${layers.map((l) => `${l.label} (${l.count})`).join(', ')}, last ${state.days || 7} days.`);
  }
  if (state.layers?.my_data && layers.some((l) => l.id === 'my_data')) {
    lines.push("'My data' pins are the user's own project records.");
  }
  lines.push('Name the specific places your answer is about, with coordinates, so the globe can fly to them.');
  lines.push('This note is context for you: do not repeat it or address the globe in your answer.');
  return `${base}\n\n[Globe view] ${lines.join(' ')}`;
}

/**
 * Drop any paragraph in which the model echoes the "[Globe view]" note back ("[Globe view] Please fly to …"):
 * it is an instruction to the page, not part of the answer.
 */
export function stripGlobeEcho(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .filter((para) => !/\[\s*globe view\s*\]/i.test(para))
    .join('\n\n')
    .trim();
}

const cleanName = (raw) =>
  String(raw || '')
    .replace(/[*_`#>\[\]]/g, '')
    .replace(/^.*\b(?:near|in|at|to|of|the epicenter of)\s+/i, '')
    .replace(/^\s*(?:and|or|then|plus)\s+/i, '')
    .replace(/[\s,:;—–-]+$/, '')
    .trim()
    .split(/\s+/)
    .slice(-4)
    .join(' ');

/**
 * Places the answer names with coordinates, e.g. "Valdivia, Chile (39.5°S, 74.5°W)" or "Tokyo (35.68, 139.69)".
 * Used when the agent answered from its own knowledge and sent no place pins. At most 5, first mention wins.
 */
export function placesFromText(text) {
  const out = [];
  const t = String(text || '');
  const re =
    /([^\n()]{0,80}?)\(\s*(?:approximately\s+|approx\.?\s+|~\s*)?(-?\d{1,2}(?:\.\d+)?)\s*°?\s*([NS])?\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])?\s*\)/gi;
  for (const m of t.matchAll(re)) {
    const hemisphereGiven = Boolean(m[3] && m[5]);
    // Without N/S/E/W both numbers need a decimal point, so "(5, 10)" or "(May 22, 1960)" is not read as a place.
    const plainDecimals = !m[3] && !m[5] && m[2].includes('.') && m[4].includes('.');
    if (!hemisphereGiven && !plainDecimals) continue;
    let lat = Number(m[2]);
    let lon = Number(m[4]);
    if (m[3] && m[3].toUpperCase() === 'S') lat = -Math.abs(lat);
    if (m[5] && m[5].toUpperCase() === 'W') lon = -Math.abs(lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    if (out.some((p) => Math.abs(p.lat - lat) < 0.01 && Math.abs(p.lon - lon) < 0.01)) continue;
    const name = cleanName(m[1]) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    out.push({ name, lat, lon });
    if (out.length >= 5) break;
  }
  return out;
}

/** The place an answer says to fly to ("… fly to **Valdivia, Chile** …"), for looking it up by name; null when none. */
export function flyTargetFromText(text) {
  const m = /\bfly (?:the globe )?to\s+\**([^*(\n—–.;]{2,60})/i.exec(String(text || ''));
  const name = m ? m[1].replace(/[\s,]+$/, '').trim() : '';
  return name.length >= 2 ? name : null;
}

/** Starter questions that fit what is selected and which layers are showing. Max 4. */
export function askSuggestions(state = {}) {
  const out = [];
  const sel = state.selected ? placeName(state.selected) : null;
  const cmp = (state.compare || []).map(placeName);
  if (cmp.length >= 2) out.push(`Compare ${cmp.slice(0, 3).join(' and ')}: risks, economy, what to watch.`);
  if (sel && state.selectedIsEvent) {
    const where = `${Number(state.selected.lat).toFixed(2)}, ${Number(state.selected.lon).toFixed(2)}`;
    out.push(`What should I know about “${sel}” at ${where}?`);
  } else if (sel) out.push(`What is happening in ${sel} right now?`);
  const on = activeLayerSummary(state.layers, state.layerCounts);
  const has = (id) => on.some((l) => l.id === id);
  if (has('earthquakes')) out.push('Which of the earthquakes shown matter most, and why?');
  if (has('wildfires') || has('storms') || has('disasters')) out.push('Where is the most serious hazard on the map right now?');
  if (has('my_data')) out.push('Which of my places are exposed to the hazards on the map?');
  if (has('weather_alerts')) out.push('Which of the severe weather alerts is most dangerous right now?');
  if (has('ocean')) out.push('Where are the roughest seas right now?');
  if (has('aurora_oval')) out.push('Where could I see the aurora tonight?');
  if (has('markets')) out.push('Which markets are moving the most today?');
  if (has('ports')) out.push('Which shipping chokepoints are near hazards on the map?');
  if (has('news_events')) out.push('Which cities are in the news most in the last hour, and why?');
  if (has('hotspots')) out.push('Where are the largest fires burning in the last 24 hours?');
  if (has('flights')) out.push('Where is air traffic densest right now?');
  if (has('wind')) out.push('Where are the strongest winds right now?');
  if (!out.length) out.push('What is the most important thing on the globe today?', 'Where should I look first?');
  return [...new Set(out)].slice(0, 4);
}

/** Cap a streamed answer so a runaway response cannot freeze the panel. */
export function clampAnswer(text, max = 6000) {
  const t = String(text || '');
  return t.length > max ? `${t.slice(0, max)}…` : t;
}
