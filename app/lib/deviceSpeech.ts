// Speech in an attached audio or video file is recognised here, in the person's own browser, with Vosk (Kaldi compiled to WebAssembly,
// offline). The model (~40 MB) is downloaded once and kept in the browser's storage; the sound is never uploaded for an audio file, and a
// video is uploaded only for its picture. Whenever this cannot run (old browser, low memory, very long recording, the model could not be
// fetched) it returns null and the server transcribes instead, so a file is never lost because of it.

import {
  BROWSER_MAX_SECONDS,
  SAMPLE_RATE,
  browserCanTranscribe,
  mixToMono,
  transcriptPayload,
  wordsToSegments,
} from './speechLines.mjs';

export const SPEECH_MODEL = process.env.NEXT_PUBLIC_SPEECH_MODEL_NAME || 'vosk-model-small-en-us-0.15';
export const SPEECH_MODEL_URL =
  process.env.NEXT_PUBLIC_SPEECH_MODEL_URL || `https://stanalyzeitdl.blob.core.windows.net/downloads/models/${SPEECH_MODEL}.tar.gz`;
const SPEECH_LANGUAGE = process.env.NEXT_PUBLIC_SPEECH_LANGUAGE || 'en';
const CHUNK_SAMPLES = SAMPLE_RATE; // one second per message to the recogniser's worker
const MAX_FILE_BYTES = 100 * 1024 * 1024; // the server's media limit

export interface DeviceTranscript {
  engine: 'vosk';
  model: string;
  language: string;
  duration_seconds: number | null;
  segments: { start: number; end: number; text: string; confidence: number }[];
}

type VoskModel = Awaited<ReturnType<typeof import('vosk-browser').createModel>>;
type Word = { word: string; start: number; end: number; conf: number };

let modelPromise: Promise<VoskModel> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function loadModel(): Promise<VoskModel> {
  if (!modelPromise) {
    modelPromise = import('vosk-browser').then((vosk) => vosk.createModel(SPEECH_MODEL_URL, -1));
    // A failed fetch is not kept: the next file tries again.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

function canRun(file: File): boolean {
  if (typeof window === 'undefined' || file.size > MAX_FILE_BYTES) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return browserCanTranscribe({
    webAssembly: typeof WebAssembly === 'object',
    offlineAudioContext: typeof OfflineAudioContext === 'function',
    worker: typeof Worker === 'function',
    deviceMemoryGb: nav.deviceMemory,
  }).ok;
}

/** The sound as 16 kHz mono (decodeAudioData resamples to the context's rate). Null when the browser cannot decode this format. */
async function decodeMono(file: File): Promise<Float32Array | null> {
  const ctx = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    return null;
  }
  if (decoded.duration > BROWSER_MAX_SECONDS) return null;
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
  return mixToMono(channels);
}

async function recognise(model: VoskModel, samples: Float32Array, onProgress?: (fraction: number) => void): Promise<Word[]> {
  const rec = new model.KaldiRecognizer(SAMPLE_RATE);
  rec.setWords(true);
  const chunks = Math.ceil(samples.length / CHUNK_SAMPLES);
  const words: Word[] = [];
  // Every chunk sent gets exactly one reply (a result or a partial result), and the final result one more: counting replies tells when
  // the worker has caught up, since it answers in order.
  const expected = chunks + 1;
  try {
    return await new Promise<Word[]>((resolve, reject) => {
      let replies = 0;
      const reply = () => {
        replies += 1;
        if (onProgress && replies % 30 === 0) onProgress(Math.min(1, replies / expected));
        if (replies >= expected) resolve(words);
      };
      rec.on('result', (msg) => {
        if (msg.event === 'result') words.push(...((msg.result?.result as Word[] | undefined) || []));
        reply();
      });
      rec.on('partialresult', reply);
      rec.on('error', (msg) => reject(new Error(msg.event === 'error' ? msg.error : 'speech recognition failed')));
      for (let i = 0; i < chunks; i++) {
        // Web Audio's -1..1 samples as they are (vosk-browser scales them to Kaldi's 16-bit range itself). A copy, because the
        // buffer is transferred to the worker.
        rec.acceptWaveformFloat(samples.slice(i * CHUNK_SAMPLES, Math.min(samples.length, (i + 1) * CHUNK_SAMPLES)), SAMPLE_RATE);
      }
      rec.retrieveFinalResult();
    });
  } finally {
    rec.remove();
  }
}

/**
 * Transcribe an audio or video file in this browser. Null when it cannot be done here (the server then does it).
 * Files are taken one at a time: two long recordings decoded at once could exhaust a laptop's memory.
 */
export function transcribeOnDevice(file: File, onProgress?: (fraction: number) => void): Promise<DeviceTranscript | null> {
  const run = async (): Promise<DeviceTranscript | null> => {
    if (!canRun(file)) return null;
    try {
      const [model, samples] = await Promise.all([loadModel(), decodeMono(file)]);
      if (!samples) return null;
      const words = await recognise(model, samples, onProgress);
      return transcriptPayload({
        segments: wordsToSegments(words),
        model: SPEECH_MODEL,
        language: SPEECH_LANGUAGE,
        durationSeconds: samples.length / SAMPLE_RATE,
      }) as DeviceTranscript;
    } catch (err) {
      console.warn('On-device transcription was not possible; the server will transcribe instead.', err);
      return null;
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
