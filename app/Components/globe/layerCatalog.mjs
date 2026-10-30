/**
 * Every globe layer: id, label, the one-line hint that says where the data comes from and how complete it is,
 * and its coverage. Shared by the web Globe page and the embeddable globe (desktop, extension), so the wording
 * is the same everywhere. Plain module so Node's test runner and esbuild can import it.
 */

export const LAYER_CATALOG = [
  { id: 'catalog', label: 'Sources', hint: 'Where agencies and statistics offices sit — a fixed reference list, not live data', coverage: 'limited' },
  { id: 'earthquakes', label: 'Earthquakes', hint: 'USGS M2.5+ · every quake in the window, updated by the minute', coverage: 'complete' },
  { id: 'disasters', label: 'Disasters', hint: 'GDACS alerts worldwide', coverage: 'complete' },
  { id: 'wildfires', label: 'Wildfires', hint: 'NASA EONET open fires', coverage: 'complete' },
  { id: 'storms', label: 'Storms', hint: 'NASA EONET severe storms', coverage: 'complete' },
  { id: 'volcanoes', label: 'Volcanoes', hint: 'NASA EONET volcanoes', coverage: 'complete' },
  { id: 'weather', label: 'Weather', hint: 'Live temperature, wind, cloud and rain on a 10° world grid · refreshed every 3 h', coverage: 'complete' },
  { id: 'air_quality', label: 'Air quality', hint: 'Live AQI and PM2.5 on a 10° world grid · refreshed every 3 h', coverage: 'complete' },
  { id: 'iss', label: 'Satellites', hint: 'ISS + selected Celestrak sats — not a full catalog', coverage: 'limited' },
  { id: 'radar', label: 'Rain radar', hint: 'Live precipitation radar mosaic (RainViewer) · refreshed every 10 min', coverage: 'complete' },
  { id: 'clouds', label: 'Live clouds', hint: 'GOES-East and Himawari satellite imagery (NASA GIBS) · refreshed every 10 min · Americas, Atlantic, East Asia and Oceania', coverage: 'limited' },
  { id: 'space_weather', label: 'Space Weather', hint: 'NOAA SWPC alerts · scales · flares', coverage: 'complete' },
  { id: 'my_data', label: 'My data', hint: 'Your project’s records with a location — lat/lon fields or place names', coverage: 'complete' },
  { id: 'weather_alerts', label: 'Severe alerts', hint: 'US National Weather Service · severe & extreme with a mapped area', coverage: 'limited' },
  { id: 'ocean', label: 'Ocean buoys', hint: 'NOAA NDBC waves & wind · stations that report', coverage: 'limited' },
  { id: 'aurora_oval', label: 'Aurora oval', hint: 'NOAA OVATION forecast · cells at 5%+', coverage: 'complete' },
  { id: 'fireballs', label: 'Fireballs', hint: 'NASA CNEOS bolides · last 6 months', coverage: 'limited' },
  { id: 'flights', label: 'Flights', hint: 'Every airborne aircraft OpenSky’s receivers see · one global snapshot, up to 15 min old · thin over oceans', coverage: 'limited' },
  { id: 'orbits', label: 'All satellites', hint: 'Every active satellite in the CelesTrak catalog · positions computed each minute', coverage: 'complete' },
  { id: 'hotspots', label: 'Fire hotspots', hint: 'NASA FIRMS VIIRS · every detection in the last 24 h, grouped into 1° cells', coverage: 'complete' },
  { id: 'news_events', label: 'News events', hint: 'GDELT · cities named in the last hour of world news, with links', coverage: 'complete' },
  { id: 'wind', label: 'Wind', hint: 'Surface wind 10 m up from NOAA’s GFS model · streamlines coloured by speed · new run every 6 h', coverage: 'complete' },
  { id: 'ports', label: 'Ports & chokepoints', hint: 'Major container and energy ports and shipping chokepoints — a fixed reference list, not live traffic', coverage: 'limited' },
  { id: 'markets', label: 'Markets', hint: 'Live headline index of each major exchange country', coverage: 'limited' },
];

/** Layers whose data is a fixed image or list rather than a server request. */
export const STATIC_LAYER_IDS = ['catalog', 'radar', 'clouds'];
