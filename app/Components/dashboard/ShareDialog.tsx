'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconCheck, IconCopy, IconLoader2 } from '@tabler/icons-react';
import { Modal } from '../ui/Modal';
import { createProjectShareLink, stopSharingProject } from '../../lib/exportApi';

const EXPIRY = [
  { label: 'No expiry', value: null },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
] as const;

/** The dashboard's read-only link: always visible so it can be copied by hand, with an expiry choice and a way to turn it off. */
export function ShareDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const field = useRef<HTMLInputElement | null>(null);

  const make = useCallback(async (days?: number | null) => {
    setBusy(true);
    setMessage('');
    try {
      const out = await createProjectShareLink(projectId, days);
      setUrl(`${window.location.origin}${out.share_url}`);
      setExpiresAt(out.expires_at ?? null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not create the link.');
    } finally {
      setBusy(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) void make();
    else {
      setUrl('');
      setCopied(false);
    }
  }, [open, make]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      field.current?.select(); // the browser would not let us write to the clipboard: the link is selected, so Ctrl/Cmd+C works
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const days = expiresAt ? Math.max(1, Math.ceil((+new Date(expiresAt) - Date.now()) / 86_400_000)) : null;
  const current = EXPIRY.find((e) => e.value === (days === null ? null : days <= 7 ? 7 : days <= 30 ? 30 : 90)) ?? EXPIRY[0];

  return (
    <Modal open={open} onClose={onClose} title="Share this dashboard" description="Anyone with the link can view it (read-only). Nobody can guess it, and it stays current as your data refreshes." size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input ref={field} readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" placeholder={busy ? 'Creating link…' : ''} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--coral)]" />
          <button type="button" onClick={() => void copy()} disabled={!url} className="btn-primary inline-flex items-center gap-1.5 text-xs disabled:opacity-50">
            {busy ? <IconLoader2 size={14} className="animate-spin" /> : copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          Link expires
          <select value={String(current.value)} disabled={busy || !url} onChange={(e) => void make(e.target.value === 'null' ? null : Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs">
            {EXPIRY.map((e) => <option key={e.label} value={String(e.value)}>{e.label}</option>)}
          </select>
          {expiresAt ? <span className="text-[var(--text-muted)]">· until {new Date(expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span> : null}
        </label>
        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <p className="text-[11px] text-[var(--text-muted)]">Viewers cannot edit, see your alerts or reach your other projects.</p>
          <button type="button" disabled={busy} className="btn-secondary text-xs disabled:opacity-50" onClick={async () => {
            setBusy(true);
            try {
              const { revoked } = await stopSharingProject(projectId);
              setMessage(revoked ? 'Sharing turned off. The old link no longer works.' : 'This dashboard was not being shared.');
              setUrl('');
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'Could not turn sharing off.');
            } finally {
              setBusy(false);
            }
          }}>Stop sharing</button>
        </div>
        {message ? <p role="status" className="text-xs text-[var(--text-muted)]">{message}</p> : null}
      </div>
    </Modal>
  );
}
