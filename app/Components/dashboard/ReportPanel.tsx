'use client';

import { useCallback, useEffect, useState } from 'react';
import { getReportSettings, saveReportSettings, sendReportPreview, type ReportSettings } from '../../lib/reportApi';

function day(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(+d) ? '' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

/** A weekly e-mail of the dashboard's headline numbers, to the owner and, if chosen, the teammates who already have the project. */
export function ReportPanel({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setSettings(await getReportSettings(projectId));
    } catch {
      setSettings(null);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!settings) return null;

  const save = async (patch: Partial<Pick<ReportSettings, 'enabled' | 'include_team'>>) => {
    setBusy(true);
    setMessage('');
    try {
      setSettings(await saveReportSettings(projectId, { enabled: settings.enabled, include_team: settings.include_team, ...patch }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    setBusy(true);
    setMessage('');
    try {
      const out = await sendReportPreview(projectId);
      setMessage(out.status === 'ok' ? 'Sent to you. It can take a minute to arrive.' : 'There is no e-mail address on your account to send it to.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send it.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Weekly report" className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Weekly report</h3>
          <p className="text-xs text-[var(--text-muted)]" role="status">
            {settings.enabled ? `On. The next one goes out ${day(settings.next_run_at) || 'next Monday'}.` : 'Off. Turn it on to get your dashboard’s headline numbers by e-mail every Monday.'}
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.enabled} disabled={busy} onChange={(e) => void save({ enabled: e.target.checked })} />
          On
        </label>
      </div>
      {settings.enabled ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.include_team} disabled={busy} onChange={(e) => void save({ include_team: e.target.checked })} />
          Also send it to my teammates (only people who already have this project)
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void preview()} className="btn-secondary text-xs disabled:opacity-50">
          {busy ? 'Working…' : 'Send me one now'}
        </button>
        {settings.last_sent_at ? <span className="text-xs text-[var(--text-muted)]">Last sent {day(settings.last_sent_at)}.</span> : null}
        {message ? <span role="status" className="text-xs text-[var(--text-muted)]">{message}</span> : null}
      </div>
    </section>
  );
}
