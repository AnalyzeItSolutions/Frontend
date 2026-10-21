import { getAuthHeaders } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/v1`;

export interface SharedProjectData {
  ok: boolean;
  title: string;
  description: string;
  layout: Record<string, any>;
  widgets: any[];
  read_only: boolean;
  shared_at?: string;
}

export interface UserUsageData {
  ok: boolean;
  user_id: string;
  total_runs: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface ProjectDuplicateResponse {
  ok: boolean;
  project_id: string;
  title: string;
  cloned_schemas?: number;
  cloned_records?: number;
}

/**
 * Downloads a complete ZIP bundle of project layout, custom objects, and metadata.
 */
export async function exportProjectZip(projectId: string): Promise<Blob> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_V1}/projects/${projectId}/export`, {
    method: 'GET',
    headers: {
      ...headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Export failed: ${errorText || res.statusText}`);
  }

  return await res.blob();
}

/**
 * Convenience helper to download project ZIP file directly in browser.
 */
export async function downloadProjectZip(projectId: string, customFilename?: string): Promise<void> {
  const blob = await exportProjectZip(projectId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = customFilename || `project_${projectId}_export.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates a public, tokenized read-only link for the project.
 */
export async function createProjectShareLink(projectId: string, expiresInDays?: number | null): Promise<{ share_token: string; share_url: string; expires_at?: string | null }> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_V1}/projects/${projectId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    // Without a body the server keeps the link and its expiry as they are; with one, the choice (including "never") replaces them.
    ...(expiresInDays === undefined ? {} : { body: JSON.stringify({ expires_in_days: expiresInDays }) }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Share link generation failed: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/** Turns the project's public link off. Anyone holding it gets "no longer shared". */
export async function stopSharingProject(projectId: string): Promise<{ revoked: number }> {
  const res = await fetch(`${API_V1}/projects/${projectId}/share`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Could not turn the link off: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches a shared read-only project by token.
 */
export async function getSharedProject(shareToken: string): Promise<SharedProjectData> {
  const res = await fetch(`${API_V1}/shared/${shareToken}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load shared project: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Retrieves token consumption and cost usage rollup for current user.
 */
export async function getUserUsage(): Promise<UserUsageData> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_V1}/users/me/usage`, {
    method: 'GET',
    headers: {
      ...headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch usage: ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Deep clones a project and its custom object records.
 */
export async function duplicateProject(projectId: string): Promise<ProjectDuplicateResponse> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API_V1}/projects/${projectId}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Project duplication failed: ${errorText || res.statusText}`);
  }

  return await res.json();
}
