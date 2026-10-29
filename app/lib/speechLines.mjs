// Pure helpers for transcribing audio and video in the person's own browser (deviceSpeech.ts runs Vosk). Kept free of browser APIs so
// they can be tested with node --test. The rules mirror the server's (Model/app/media.py) so a transcript reads the same either way.

export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'flac', 'wma', 'aiff', 'aif', 'aifc', 'amr', 'weba', 'mka', 'caf', 'ac3', 'mp2'];
// "ts" is not listed: .ts is TypeScript. A transport stream can be uploaded as .mts/.m2ts.
export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'mkv', 'webm', 'avi', 'wmv', 'flv', 'f4v', 'mpeg', 'mpg', 'mpe', '3gp', '3g2', 'mts', 'm2ts',
  'ogv', 'vob', 'asf', 'qt', 'mxf', 'divx'];

export const SAMPLE_RATE = 16000;
export const PAUSE_SPLIT_S = 0.8;   // a pause this long between words starts a new line
export const LINE_MAX_S = 20;
// Decoded sound is held in memory as 32-bit floats (16 kHz mono = ~3.8 MB a minute), so a browser takes recordings up to this long;
// a longer one is transcribed on the server instead.
export const BROWSER_MAX_SECONDS = 90 * 60;

const extOf = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return m ? m[1].toLowerCase() : '';
};

/** 'audio', 'video' or null (not a media file). */
export function mediaKind(name) {
  const ext = extOf(name);
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return null;
}

/** Vosk words ({word, start, end, conf}) -> timestamped lines, split at a pause or after LINE_MAX_S; confidence is the words' mean. */
export function wordsToSegments(words) {
  const lines = [];
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    const conf = cur.reduce((s, w) => s + (Number(w.conf) || 0), 0) / cur.length;
    lines.push({
      start: round2(cur[0].start),
      end: round2(cur[cur.length - 1].end),
      text: cur.map((w) => String(w.word)).join(' '),
      confidence: round2(conf),
    });
    cur = [];
  };
  for (const w of Array.isArray(words) ? words : []) {
    if (!w || !String(w.word || '').trim() || typeof w.start !== 'number') continue;
    if (cur.length && (w.start - cur[cur.length - 1].end >= PAUSE_SPLIT_S || w.end - cur[0].start > LINE_MAX_S)) flush();
    cur.push(w);
  }
  flush();
  return lines;
}

/** Several channels averaged into one (a stereo call keeps both speakers). */
export function mixToMono(channels) {
  if (!channels.length) return new Float32Array(0);
  if (channels.length === 1) return channels[0];
  const n = channels[0].length;
  const out = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) out[i] += ch[i];
  for (let i = 0; i < n; i++) out[i] /= channels.length;
  return out;
}

/** Whether this browser should try: WebAssembly, Web Audio, and enough memory. Reasons are for logs, not the person. */
export function browserCanTranscribe(env) {
  if (!env.webAssembly) return { ok: false, reason: 'no WebAssembly' };
  if (!env.offlineAudioContext) return { ok: false, reason: 'no Web Audio' };
  if (!env.worker) return { ok: false, reason: 'no Web Workers' };
  if (typeof env.deviceMemoryGb === 'number' && env.deviceMemoryGb < 2) return { ok: false, reason: 'low memory' };
  return { ok: true, reason: '' };
}

/** The transcript as the server takes it (Backend app/services/media.py parse_device_transcript). */
export function transcriptPayload({ segments, model, language = 'en', durationSeconds }) {
  return { engine: 'vosk', model, language, duration_seconds: round2(durationSeconds || 0) || null, segments };
}

function round2(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}
