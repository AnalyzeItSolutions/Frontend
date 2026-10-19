// Colour scales for live globe pins, so a dot's colour carries its value instead of one flat colour per layer.

const TEMP_STOPS = [
  [-30, [76, 29, 149]],
  [-10, [37, 99, 235]],
  [0, [56, 189, 248]],
  [10, [52, 211, 153]],
  [20, [250, 204, 21]],
  [30, [249, 115, 22]],
  [40, [220, 38, 38]],
];

const hex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** A temperature in °C on a blue-to-red scale; null when there is no number. */
export function temperatureColor(c) {
  const t = Number(c);
  if (c == null || !Number.isFinite(t)) return null;
  if (t <= TEMP_STOPS[0][0]) return hex(TEMP_STOPS[0][1]);
  for (let i = 1; i < TEMP_STOPS.length; i += 1) {
    const [t1, c1] = TEMP_STOPS[i];
    if (t <= t1) {
      const [t0, c0] = TEMP_STOPS[i - 1];
      const f = (t - t0) / (t1 - t0);
      return hex(c0.map((v, k) => v + (c1[k] - v) * f));
    }
  }
  return hex(TEMP_STOPS[TEMP_STOPS.length - 1][1]);
}

/** The standard US AQI bands. */
export function aqiColor(aqi) {
  const v = Number(aqi);
  if (aqi == null || !Number.isFinite(v)) return null;
  if (v <= 50) return '#22c55e';
  if (v <= 100) return '#eab308';
  if (v <= 150) return '#f97316';
  if (v <= 200) return '#ef4444';
  if (v <= 300) return '#a855f7';
  return '#7f1d1d';
}

export function magnitudeColor(mag) {
  const v = Number(mag);
  if (mag == null || !Number.isFinite(v)) return null;
  if (v < 4) return '#fbbf24';
  if (v < 5) return '#f59e0b';
  if (v < 6) return '#ea580c';
  return '#dc2626';
}

/** The colour for one live pin, or null to fall back to its layer colour. */
export function valueColor(host, meta) {
  const m = meta || {};
  if (host === 'weather') return temperatureColor(m.temperature_c);
  if (host === 'air_quality') return aqiColor(m.aqi);
  if (host === 'earthquakes') return magnitudeColor(m.mag);
  return null;
}

const AQI_STOPS = [
  [0, [34, 197, 94]],
  [50, [234, 179, 8]],
  [100, [249, 115, 22]],
  [150, [239, 68, 68]],
  [200, [168, 85, 247]],
  [300, [127, 29, 29]],
];

/** A continuous version of the AQI bands, for colour fields (the pins use the stepped bands). */
export function aqiGradient(aqi) {
  const v = Number(aqi);
  if (aqi == null || !Number.isFinite(v)) return null;
  if (v <= AQI_STOPS[0][0]) return hex(AQI_STOPS[0][1]);
  for (let i = 1; i < AQI_STOPS.length; i += 1) {
    const [t1, c1] = AQI_STOPS[i];
    if (v <= t1) {
      const [t0, c0] = AQI_STOPS[i - 1];
      const f = (v - t0) / (t1 - t0);
      return hex(c0.map((x, k) => x + (c1[k] - x) * f));
    }
  }
  return hex(AQI_STOPS[AQI_STOPS.length - 1][1]);
}
