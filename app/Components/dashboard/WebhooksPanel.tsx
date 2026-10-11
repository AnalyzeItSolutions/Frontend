'use client';

import { useCallback, useEffect, useState } from 'react';
import { createWebhook, deleteWebhook, listWebhooks, testWebhook, WEBHOOK_EVENTS, type Webhook } from '../../lib/alertsApi';
import { useConfirm } from '../ui/ConfirmDialog';

/** Webhooks: a URL of the owner's that is told when an alert is raised or a digest is made. Signed when a secret is set. */
export function WebhooksPanel() {
  const confirm = useConfirm();
  const [hooks, setHooks] = useState<Webhook[] | null>(null);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(WEBHOOK_EVENTS.map((e) => e.id));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setHooks(await listWebhooks());
    } catch {
      setHooks(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!hooks) return null;

  const add = async () => {
    setBusy('add');
    setMessage('');
    try {
      await createWebhook({ url: url.trim(), events, secret: secret.trim() || undefined });
      setUrl('');
      setSecret('');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not add it.');
    } finally {
      setBusy(null);
    }
  };

  const test = async (h: Webhook) => {
    setBusy(h.id);
    setMessage('');
    try {
      const r = await testWebhook(h.id);
      setMessage(r.ok ? 'Test delivered.' : `Test not delivered${r.error ? `: ${r.error}` : ''}. It will be retried.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send a test.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (h: Webhook) => {
    if (!(await confirm({ title: 'Remove this webhook?', message: h.url, confirmLabel: 'Remove', danger: true }))) return;
    setBusy(h.id);
    try {
      await deleteWebhook(h.id);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not remove it.');
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string) => setEvents((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]));

  return (
    <section aria-label="Webhooks" className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div>
        <h3 className="font-semibold text-[var(--text-primary)]">Webhooks</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Send alerts and digests to your own tools. Each one is a JSON POST. Set a secret and it carries <code>X-AnalyzeIt-Signature</code>, an HMAC-SHA256 of the body.
        </p>
      </div>

      {hooks.length ? (
        <ul className="divide-y divide-[var(--border)] text-sm">
          {hooks.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-[var(--text-primary)]">{h.url}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{h.events.join(', ')}{h.has_secret ? ' · signed' : ''}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy === h.id} onClick={() => void test(h)} className="btn-secondary text-xs disabled:opacity-50">Send test</button>
                <button type="button" disabled={busy === h.id} onClick={() => void remove(h)} className="btn-secondary text-xs disabled:opacity-50">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/hooks/analyzeit"
            aria-label="Webhook address"
            inputMode="url"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs"
          />
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret (optional)"
            aria-label="Webhook secret"
            autoComplete="off"
            className="w-44 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          {WEBHOOK_EVENTS.map((e) => (
            <label key={e.id} className="flex items-center gap-2">
              <input type="checkbox" checked={events.includes(e.id)} onChange={() => toggle(e.id)} />
              {e.label}
            </label>
          ))}
          <button type="button" disabled={busy === 'add' || !/^https?:\/\//i.test(url.trim()) || events.length === 0} onClick={() => void add()} className="btn-primary ml-auto text-xs disabled:opacity-50">
            {busy === 'add' ? 'Adding…' : 'Add webhook'}
          </button>
        </div>
        {message ? <p role="status" className="text-xs text-[var(--text-muted)]">{message}</p> : null}
      </div>
    </section>
  );
}
