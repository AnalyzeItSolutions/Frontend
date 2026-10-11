import type { ChatAttachment } from './attachmentsApi';

export const MAX_FILES_PER_MESSAGE: number;
export const MAX_FILE_BYTES: number;
export const SUPPORTED_EXTENSIONS: string[];
export function planIntake(
  files: File[],
  alreadyAttached?: Array<{ filename: string; size_bytes?: number }>,
  opts?: { maxFiles?: number; maxBytes?: number },
): { take: File[]; skipped: Array<{ name: string; reason: string }> };
export interface UploadResult { file: File; attachment?: ChatAttachment; error?: string }
export function uploadAll(
  files: File[],
  upload: (file: File) => Promise<ChatAttachment>,
  opts?: { concurrency?: number; onProgress?: (done: number, total: number) => void },
): Promise<UploadResult[]>;
export function intakeMessage(skipped: Array<{ name: string; reason: string }>, results: UploadResult[]): string;
export function sendableIds(attachments: Array<{ attachment_id: string; status: string }>): string[];
