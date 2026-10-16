'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredToken } from '../../lib/auth';
import { lastUsed } from '../../lib/oauthConsent.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Grant = { id: string; client_name: string; redirect_host?: string; scope?: string; created_at: number; last_used_at: number | null };

/** AI assistants the user has connected (ChatGPT, Claude, ...). Each can be disconnected at any time. */
export function ConnectedApps() {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = useCallback(() => ({ Authorization: `Bearer ${getStoredToken() || ''}` }), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/oauth/grants`, { headers: headers() });
      if (!res.ok) throw new Error();
      setGrants(((await res.json()) as { grants: Grant[] }).grants);
      setError('');
    } catch {
      setError('Could not load connected apps.');
    }
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id?: string) {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/v1/oauth/grants${id ? `/${encodeURIComponent(id)}` : ''}`, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError('Could not disconnect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Connected AI apps</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Assistants you let read your AnalyzeIt data. They can only read what you have allowed in each project, and cannot change anything.{' '}
          <a href="/docs/connect-assistant" className="underline">How to connect one</a>.
        </p>
      </div>
      {error && <p role="alert" className="text-xs text-[#141414]">{error}</p>}
      {grants && grants.length === 0 && <p className="text-xs text-[var(--text-muted)]">No apps connected.</p>}
      {grants && grants.length > 0 && (
        <ul className="space-y-2">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{g.client_name}</span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {g.redirect_host ? `${g.redirect_host} · ` : ''}
                  {lastUsed(g.last_used_at)}
                </span>
                {g.scope?.split(' ').includes('approve') ? (
                  <span className="mt-0.5 block text-xs text-[#141414]">Can apply changes and open access when you tell it to in chat. Disconnect and reconnect to turn that off.</span>
                ) : null}
              </span>
              <button type="button" disabled={busy} onClick={() => revoke(g.id)} className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-2)] disabled:opacity-60">
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      )}
      {grants && grants.length > 1 && (
        <button type="button" disabled={busy} onClick={() => revoke()} className="text-xs text-[#141414] underline disabled:opacity-60">
          Disconnect all
        </button>
      )}
    </div>
  );
}
