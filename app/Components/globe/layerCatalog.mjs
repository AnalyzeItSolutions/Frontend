/**
 * Every globe layer: id, label, the one-line hint that says where the data comes from and how complete it is,
 * and its coverage. Shared by the web Globe page and the embeddable globe (desktop, extension), so the wording
 * is the same everywhere. Plain module so Node's test runner and esbuild can import it.
 */

/** The layer list's sections, in order. */
export const LAYER_GROUPS = [
  { id: 'mine', label: 'Your data' },
  { id: 'live', label: 'Live now' },
  { id: 'weather', label: 'Weather & sea' },
  { id: 'hazards', label: 'Hazards' },
  { id: 'space', label: 'Space' },
  { id: 'trade', label: 'Trade & reference' },
];

/** What the globe opens with: the live world, not two layers that look like the old globe. */
export const DEFAULT_ON = ['earthquakes', 'weather', 'flights', 'news_events'];

export const LAYER_CATALOG = [
  { id: 'catalog', label: 'Sources', hint: 'Where agencies and statistics offices sit — a fixed reference list, not live data', group: 'trade', coverage: 'limited' },
  { id: 'earthquakes', label: 'Earthquakes', hint: 'USGS M2.5+ · every quake in the window, updated by the minute', group: 'live', coverage: 'complete' },
  { id: 'disasters', label: 'Disasters', hint: 'GDACS alerts worldwide', group: 'hazards', coverage: 'complete' },
  { id: 'wildfires', label: 'Wildfires', hint: 'NASA EONET open fires', group: 'hazards', coverage: 'complete' },
  { id: 'storms', label: 'Storms', hint: 'NASA EONET severe storms', group: 'weather', coverage: 'complete' },
  { id: 'volcanoes', label: 'Volcanoes', hint: 'NASA EONET volcanoes', group: 'hazards', coverage: 'complete' },
  { id: 'weather', label: 'Weather', hint: 'Live temperature, wind, cloud and rain on a 10° world grid · refreshed every 3 h', group: 'weather', coverage: 'complete' },
  { id: 'air_quality', label: 'Air quality', hint: 'Live AQI and PM2.5 on a 10° world grid · refreshed every 3 h', group: 'weather', coverage: 'complete' },
  { id: 'iss', label: 'Space station', hint: 'Where the ISS is now and its track', group: 'space', coverage: 'complete' },
  { id: 'radar', label: 'Rain radar', hint: 'Live precipitation radar mosaic (RainViewer) · refreshed every 10 min', group: 'weather', coverage: 'complete' },
  { id: 'clouds', label: 'Live clouds', hint: 'GOES-East and Himawari satellite imagery (NASA GIBS) · refreshed every 10 min · Americas, Atlantic, East Asia and Oceania', group: 'weather', coverage: 'limited' },
  { id: 'space_weather', label: 'Space Weather', hint: 'NOAA SWPC alerts · scales · flares', group: 'space', coverage: 'complete' },
  { id: 'my_data', label: 'My data', hint: 'Your project’s records with a location — lat/lon fields or place names', group: 'mine', coverage: 'complete' },
  { id: 'weather_alerts', label: 'Severe alerts', hint: 'US National Weather Service · severe & extreme with a mapped area', group: 'weather', coverage: 'limited' },
  { id: 'ocean', label: 'Ocean buoys', hint: 'NOAA NDBC waves & wind · stations that report', group: 'weather', coverage: 'limited' },
  { id: 'aurora_oval', label: 'Aurora oval', hint: 'NOAA OVATION forecast · cells at 5%+', group: 'space', coverage: 'complete' },
  { id: 'fireballs', label: 'Fireballs', hint: 'NASA CNEOS bolides · last 6 months', group: 'space', coverage: 'limited' },
  { id: 'flights', label: 'Flights', hint: 'Every airborne aircraft OpenSky’s receivers see · one global snapshot, up to 15 min old · thin over oceans · when that feed is down, the aircraft within 250 nm of your view (adsb.lol)', group: 'live', coverage: 'limited' },
  { id: 'orbits', label: 'All satellites', hint: 'Every active satellite in the CelesTrak catalog · positions computed each minute', group: 'space', coverage: 'complete' },
  { id: 'hotspots', label: 'Fire hotspots', hint: 'NASA FIRMS VIIRS · every detection in the last 24 h, grouped into 1° cells', group: 'live', coverage: 'complete' },
  { id: 'news_events', label: 'News events', hint: 'GDELT · cities named in the last hour of world news, with links', group: 'live', coverage: 'complete' },
  { id: 'wind', label: 'Wind', hint: 'Surface wind 10 m up from NOAA’s GFS model · streamlines coloured by speed · new run every 6 h', group: 'weather', coverage: 'complete' },
  { id: 'ports', label: 'Ports & chokepoints', hint: 'Major container and energy ports and shipping chokepoints — a fixed reference list, not live traffic', group: 'trade', coverage: 'limited' },
  { id: 'markets', label: 'Markets', hint: 'Live headline index of each major exchange country', group: 'trade', coverage: 'limited' },
];

/** Layers whose data is a fixed image or list rather than a server request. */
export const STATIC_LAYER_IDS = ['catalog', 'radar', 'clouds'];
