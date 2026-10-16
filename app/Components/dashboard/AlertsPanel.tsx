'use client';

import { useCallback, useEffect, useState } from 'react';
import { checkAlertsNow, getAlertSettings, listAlerts, markAlertsRead, saveAlertSettings, type AlertSettings, type ProjectAlert } from '../../lib/alertsApi';

function when(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(+d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Tells the owner when payments change: a fall in success rate, one method failing, a burst of refunds, a connector that stopped syncing. */
export function AlertsPanel({ projectId }: { projectId: string }) {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([getAlertSettings(projectId), listAlerts(projectId)]);
      setSettings(s);
      setAlerts(a.alerts);
      if (a.unread > 0) void markAlertsRead(projectId);
    } catch {
      setSettings(null);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!settings) return null;

  const save = async (patch: Partial<AlertSettings>) => {
    setBusy(true);
    setMessage('');
    try {
      setSettings(await saveAlertSettings(projectId, { ...settings, ...patch }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { created } = await checkAlertsNow(projectId);
      setMessage(created.length ? `${created.length} new alert${created.length === 1 ? '' : 's'}.` : 'Nothing new. Payments look normal against the week before.');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not check.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Alerts" className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Alerts</h3>
          <p className="text-xs text-[var(--text-muted)]">
            After each Razorpay sync, the last 24 hours are compared with the week before. You hear about a fall in success rate, one payment method failing, a burst of refunds, or Razorpay no longer syncing.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.enabled} disabled={busy} onChange={(e) => void save({ enabled: e.target.checked })} />
          On
        </label>
      </div>

      {settings.enabled ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.email} disabled={busy} onChange={(e) => void save({ email: e.target.checked })} />
            Email me
          </label>
          <label className="flex items-center gap-2" title="Uses the Slack webhook saved under Weekly digest">
            <input type="checkbox" checked={settings.slack} disabled={busy} onChange={(e) => void save({ slack: e.target.checked })} />
            Post to Slack
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.webhooks} disabled={busy} onChange={(e) => void save({ webhooks: e.target.checked })} />
            Send to my webhooks
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void check()} className="btn-secondary text-xs disabled:opacity-50">
          {busy ? 'Working…' : 'Check now'}
        </button>
        {message ? <span role="status" className="text-xs text-[var(--text-muted)]">{message}</span> : null}
      </div>

      {alerts.length ? (
        <ul className="divide-y divide-[var(--border)] text-sm">
          {alerts.map((a) => (
            <li key={a.id} className="space-y-0.5 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">
                  <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full ${a.severity === 'high' ? 'bg-[var(--danger)]' : 'bg-[var(--coral)]'}`} />
                  {a.title}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{when(a.created_at)}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{a.detail}</p>
              {a.diagnosis?.summary ? <p className="text-xs text-[var(--text-secondary)]"><strong>Why:</strong> {a.diagnosis.summary}</p> : null}
              {a.diagnosis?.advice?.length ? (
                <ul className="list-disc pl-5 text-xs text-[var(--text-muted)]">
                  {a.diagnosis.advice.map((t) => <li key={t}>{t}</li>)}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">No alerts yet.</p>
      )}
    </section>
  );
}
