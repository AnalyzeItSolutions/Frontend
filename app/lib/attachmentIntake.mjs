// Pure helpers for attaching several files at once: decide which files to take, upload them a few at a time so one bad
// file does not lose the others, and say in plain words what happened to each.

export const MAX_FILES_PER_MESSAGE = 10;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = ['csv', 'tsv', 'txt', 'dsv', 'psv', 'tab', 'json', 'ndjson', 'jsonl', 'xlsx', 'xlsm', 'pdf', 'twb', 'twbx',
  // Images: the server reads their text (OCR).
  'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff', 'gif'];

const extOf = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return m ? m[1].toLowerCase() : '';
};

/** Split picked files into the ones to upload and the ones skipped, each skipped file with its reason. */
export function planIntake(files, alreadyAttached = [], { maxFiles = MAX_FILES_PER_MESSAGE, maxBytes = MAX_FILE_BYTES } = {}) {
  const have = new Set(alreadyAttached.map((a) => `${a.filename}|${a.size_bytes ?? ''}`));
  const take = [];
  const skipped = [];
  const room = Math.max(0, maxFiles - alreadyAttached.length);
  for (const file of Array.isArray(files) ? files : []) {
    const name = file?.name || 'file';
    if (!file || file.size === 0) skipped.push({ name, reason: 'is empty' });
    else if (!SUPPORTED_EXTENSIONS.includes(extOf(name))) skipped.push({ name, reason: `is not a supported type (use ${SUPPORTED_EXTENSIONS.map((e) => '.' + e).join(' ')})` });
    else if (file.size > maxBytes) skipped.push({ name, reason: `is larger than ${Math.round(maxBytes / 1048576)} MB` });
    else if (have.has(`${name}|${file.size}`) || take.some((t) => t.name === name && t.size === file.size)) skipped.push({ name, reason: 'is already attached' });
    else if (take.length >= room) skipped.push({ name, reason: `was not added (at most ${maxFiles} files per message)` });
    else take.push(file);
  }
  return { take, skipped };
}

/** Upload with a small worker pool. One failure never discards the others. `upload(file)` resolves to an attachment. */
export async function uploadAll(files, upload, { concurrency = 3, onProgress } = {}) {
  const results = new Array(files.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      try {
        results[i] = { file: files[i], attachment: await upload(files[i]) };
      } catch (err) {
        results[i] = { file: files[i], error: err instanceof Error ? err.message : 'Upload failed.' };
      }
      done += 1;
      if (onProgress) onProgress(done, files.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
  return results; // same order as the picked files
}

/** One message for the person: what was skipped, what failed, what is ready. Empty when everything went through. */
export function intakeMessage(skipped, results) {
  const lines = [];
  for (const s of skipped) lines.push(`${s.name} ${s.reason}.`);
  for (const r of results) {
    if (r.error) lines.push(`${r.file.name}: ${r.error}`);
    else if (r.attachment?.status === 'failed') lines.push(`${r.attachment.filename}: ${r.attachment.notes?.[0] || 'Could not read this file.'}`);
  }
  return lines.join(' ');
}

/** Attachments the message may carry: readable ones only. */
export const sendableIds = (attachments) => attachments.filter((a) => a.status !== 'failed').map((a) => a.attachment_id);
