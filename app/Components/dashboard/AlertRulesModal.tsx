'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconBell, IconTrash } from '@tabler/icons-react';
import { Modal } from '../ui/Modal';
import { checkAlertsNow, getAlertSettings, listAlerts, markAlertsRead, saveAlertSettings, type AlertSettings, type ProjectAlert } from '../../lib/alertsApi';
import { createMetricRule, deleteMetricRule, listMetricRules, refreshPublicData, updateMetricRule, type MetricRule } from '../../lib/countryPackApi';

export interface WatchableWidget {
  id: string;
  title: string;
  latest: number;
}

const OPS: Array<{ id: MetricRule['op']; label: string; verb: string }> = [
  { id: 'gt', label: 'above', verb: 'goes above' },
  { id: 'lt', label: 'below', verb: 'goes below' },
  { id: 'up_pct', label: 'rises by more than %', verb: 'rises by more than (%)' },
  { id: 'down_pct', label: 'falls by more than %', verb: 'falls by more than (%)' },
];

const field = 'rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs outline-none focus:border-[var(--coral)]';

const round = (v?: number | null) => (typeof v === 'number' ? Number(v.toFixed(2)) : v);

function when(iso: string | null): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(+d) ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
}

/** Everything about being told: which numbers to watch and at what level, how you are told, and what has been raised. */
export function AlertRulesModal({ open, onClose, projectId, watchable }: { open: boolean; onClose: () => void; projectId: string; watchable: WatchableWidget[] }) {
  const [rules, setRules] = useState<MetricRule[]>([]);
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ widget_id: string; op: MetricRule['op']; threshold: string }>({ widget_id: '', op: 'gt', threshold: '' });

  const load = useCallback(async () => {
    try {
      const [r, a, s] = await Promise.all([listMetricRules(projectId), listAlerts(projectId), getAlertSettings(projectId)]);
      setRules(r);
      setAlerts(a.alerts);
      setSettings(s);
      if (a.unread > 0) void markAlertsRead(projectId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not load alerts');
    }
  }, [projectId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const run = async (fn: () => Promise<unknown>, ok = '') => {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      if (ok) setMessage(ok);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const watched = new Set(rules.map((r) => r.widget_id));
  const addable = watchable.filter((w) => !watched.has(w.id));

  return (
    <Modal open={open} onClose={onClose} title="Alerts" description="Get told when a number crosses a line you care about. Checked automatically every few hours." size="lg">
      <div className="space-y-5">
        <section aria-label="Alert rules" className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">What to watch</h3>
          {rules.length === 0 ? <p className="text-xs text-[var(--text-muted)]">No alert rules yet. Add one below, or track a country to get a sensible set.</p> : null}
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                <input type="checkbox" checked={r.enabled} aria-label={`${r.label} alert on`} disabled={busy} onChange={(e) => void run(() => updateMetricRule(projectId, r.id, { enabled: e.target.checked }))} />
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]" title={r.meaning}>{r.label}</span>
                <span className="text-[var(--text-muted)]">when</span>
                <select className={field} value={r.op} aria-label="Condition" disabled={busy} onChange={(e) => void run(() => updateMetricRule(projectId, r.id, { op: e.target.value as MetricRule['op'] }))}>
                  {OPS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <input type="number" step="any" className={`${field} w-20`} defaultValue={r.threshold} aria-label="Alert level" disabled={busy} onBlur={(e) => { const v = Number(e.target.value); if (e.target.value !== '' && v !== r.threshold) void run(() => updateMetricRule(projectId, r.id, { threshold: v })); }} />
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${r.last_state === 'breached' ? 'bg-[var(--danger)]/15 text-[var(--danger)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                  {r.last_state === 'breached' ? `Crossed · now ${round(r.last_value)}` : r.last_value != null ? `OK · now ${round(r.last_value)}` : 'Not checked yet'}
                </span>
                <button type="button" aria-label={`Remove ${r.label} alert`} className="text-[var(--text-muted)] hover:text-[var(--danger)]" disabled={busy} onClick={() => void run(() => deleteMetricRule(projectId, r.id))}><IconTrash size={14} /></button>
              </li>
            ))}
          </ul>
          <form
            className="flex flex-wrap items-center gap-2 text-xs"
            onSubmit={(e) => {
              e.preventDefault();
              const w = watchable.find((x) => x.id === draft.widget_id);
              if (!w || draft.threshold === '') return;
              void run(() => createMetricRule(projectId, { widget_id: w.id, label: w.title, op: draft.op, threshold: Number(draft.threshold), severity: 'medium' }), 'Alert added.').then(() => setDraft({ widget_id: '', op: 'gt', threshold: '' }));
            }}
          >
            <select className={`${field} min-w-[11rem]`} value={draft.widget_id} aria-label="Figure to watch" onChange={(e) => setDraft((d) => ({ ...d, widget_id: e.target.value }))}>
              <option value="">Watch a figure…</option>
              {addable.map((w) => <option key={w.id} value={w.id}>{w.title} (now {round(w.latest)})</option>)}
            </select>
            <select className={field} value={draft.op} aria-label="Condition" onChange={(e) => setDraft((d) => ({ ...d, op: e.target.value as MetricRule['op'] }))}>
              {OPS.map((o) => <option key={o.id} value={o.id}>{o.verb}</option>)}
            </select>
            <input type="number" step="any" className={`${field} w-24`} placeholder="level" aria-label="New alert level" value={draft.threshold} onChange={(e) => setDraft((d) => ({ ...d, threshold: e.target.value }))} />
            <button type="submit" disabled={busy || !draft.widget_id || draft.threshold === ''} className="btn-secondary text-xs disabled:opacity-50">Add alert</button>
          </form>
        </section>

        {settings ? (
          <section aria-label="How you are told" className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">How you are told</h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="text-xs text-[var(--text-muted)]">In the app: always</span>
              {([['email', 'Email me'], ['slack', 'Post to Slack'], ['webhooks', 'Send to my webhooks']] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={settings[key]} disabled={busy} onChange={(e) => void run(async () => setSettings(await saveAlertSettings(projectId, { ...settings, [key]: e.target.checked })))} />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.enabled} disabled={busy} onChange={(e) => void run(async () => setSettings(await saveAlertSettings(projectId, { ...settings, enabled: e.target.checked })))} />
                All alerts on
              </label>
            </div>
          </section>
        ) : null}

        <section aria-label="Recent alerts" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent alerts</h3>
            <button type="button" disabled={busy} className="btn-secondary text-xs disabled:opacity-50" onClick={() => void run(async () => { await refreshPublicData(projectId); const { created } = await checkAlertsNow(projectId); setMessage(created.length ? `${created.length} new alert${created.length === 1 ? '' : 's'}.` : 'Checked: nothing new.'); })}>Check now</button>
          </div>
          {alerts.length === 0 ? <p className="text-xs text-[var(--text-muted)]">Nothing has crossed a line yet.</p> : null}
          <ul className="space-y-1.5">
            {alerts.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]"><IconBell size={12} className={a.severity === 'high' ? 'text-[var(--danger)]' : 'text-[#D98F3F]'} />{a.title}<span className="ml-auto font-normal text-[var(--text-muted)]">{when(a.created_at)}</span></p>
                <p className="mt-0.5 text-[var(--text-secondary)]">{a.detail}</p>
              </li>
            ))}
          </ul>
        </section>
        {message ? <p role="status" className="text-xs text-[var(--text-muted)]">{message}</p> : null}
      </div>
    </Modal>
  );
}
