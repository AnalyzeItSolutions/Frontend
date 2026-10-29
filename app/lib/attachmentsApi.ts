import { getStoredToken } from './auth';
import { parseApiFailure } from './apiErrors';
import { transcribeOnDevice } from './deviceSpeech';
import { mediaKind } from './speechLines.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/v1`;

/** Auth headers for multipart — omit Content-Type so the browser sets the boundary. */
function multipartAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export const ATTACHMENT_ACCEPT_ATTR = [
  '.csv', '.tsv', '.txt', '.dsv', '.psv', '.tab',
  '.json', '.ndjson', '.jsonl',
  '.xlsx', '.xlsm',
  '.pdf',
  '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff', '.gif',
  '.twb', '.twbx',
  // Audio and video: speech is transcribed in this browser when it can be (deviceSpeech.ts), otherwise by the server, which also
  // describes what a video shows (any format ffmpeg reads).
  '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.flac', '.wma', '.aiff', '.aif', '.aifc', '.amr', '.weba', '.mka', '.caf', '.ac3', '.mp2',
  '.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi', '.wmv', '.flv', '.f4v', '.mpeg', '.mpg', '.mpe', '.3gp', '.3g2', '.mts', '.m2ts', '.ogv', '.vob', '.asf', '.qt', '.mxf', '.divx',
].join(',');

export interface ChatAttachment {
  attachment_id: string;
  filename: string;
  status: string;
  size_bytes: number;
  mime_type?: string;
  project_id?: string;
  run_id?: string | null;
  created_at?: string;
  extracted_summary?: string;
  notes?: string[];
  page_count?: number | null;
  /** Set for audio/video uploads: what the streams turned out to hold, and how long the recording is. */
  media_kind?: 'audio' | 'video' | null;
  duration_seconds?: number | null;
  /** Where the speech was recognised: on the person's device (Vosk) or on the server. */
  transcribed_on?: 'device' | 'server' | null;
}

export async function uploadChatAttachment(
  projectId: string | null | undefined,
  file: File,
  runId?: string | null,
): Promise<ChatAttachment> {
  const kind = mediaKind(file.name);
  const transcript = kind ? await transcribeOnDevice(file) : null;
  if (transcript && kind === 'audio') {
    // The speech was recognised here: only the transcript is sent, never the sound.
    const res = await fetch(`${API_V1}/chat/attachments/transcript`, {
      method: 'POST',
      headers: { ...multipartAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, size_bytes: file.size, transcript, project_id: projectId || null, run_id: runId || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const failure = parseApiFailure(res.status, err);
      throw new Error(failure.message || `Could not attach ${file.name}.`);
    }
    return res.json();
  }

  const body = new FormData();
  body.append('file', file);
  if (projectId) body.append('project_id', projectId);
  if (runId) body.append('run_id', runId);
  // A video still goes up for its picture (scene changes, text on screen); its speech is already done.
  if (transcript) body.append('device_transcript', JSON.stringify(transcript));

  const res = await fetch(`${API_V1}/chat/attachments`, {
    method: 'POST',
    headers: multipartAuthHeaders(),
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const failure = parseApiFailure(res.status, err);
    throw new Error(failure.message || `Could not attach ${file.name}.`);
  }
  return res.json();
}

export async function deleteChatAttachment(attachmentId: string): Promise<void> {
  const res = await fetch(`${API_V1}/chat/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: multipartAuthHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const failure = parseApiFailure(res.status, err);
    throw new Error(failure.message || 'Could not remove attachment.');
  }
}

export async function listProjectAttachments(
  projectId: string,
  runId?: string | null,
): Promise<ChatAttachment[]> {
  const qs = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
  const res = await fetch(`${API_V1}/projects/${projectId}/attachments${qs}`, {
    headers: multipartAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const failure = parseApiFailure(res.status, err);
    throw new Error(failure.message || 'Could not list attachments.');
  }
  const data = await res.json();
  return Array.isArray(data?.attachments) ? data.attachments : [];
}
