'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  connectAccount, listAccounts, listProviders, removeAccount, type ExternalAccount, type ProviderSpec,
} from '../../lib/externalActionsApi';

/**
 * The one place a login is typed. Values go straight from these fields to the API and are cleared right after; they are never put in the chat,
 * never kept in component state after saving, and never shown again. The assistant only ever sees the label you give the account.
 */
export function ConnectAccountDialog({
  open,
  onClose,
  initialService,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  initialService?: string;
  onChanged?: (accounts: ExternalAccount[]) => void;
}) {
  const [providers, setProviders] = useState<ProviderSpec[]>([]);
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [service, setService] = useState('');
  const [label, setLabel] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    const list = await listAccounts();
    setAccounts(list);
    onChanged?.(list);
  }, [onChanged]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void (async () => {
      try {
        const [p, a] = await Promise.all([listProviders(), listAccounts()]);
        if (!alive) return;
        setProviders(p);
        setAccounts(a);
        setService((cur) => cur || p.find((x) => x.id === initialService)?.id || p[0]?.id || '');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Could not load');
      }
    })();
    return () => {
      alive = false;
      setValues({});     // a half-typed login does not outlive the dialog
    };
  }, [open, initialService]);

  const close = useCallback(() => {
    setError(null);
    setSaved(null);
    setValues({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) firstField.current?.focus();
  }, [open, service]);

  if (!open) return null;
  const spec = providers.find((p) => p.id === service);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spec) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const created = await connectAccount(spec.id, label || spec.name, values);
      setValues({});
      setLabel('');
      setSaved(`${created.label} is connected. The assistant can now propose actions on it; you approve each one.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the account');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: ExternalAccount) => {
    if (!window.confirm(`Remove ${a.label}? Anything waiting for approval on it is cancelled.`)) return;
    try {
      await removeAccount(a.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the account');
    }
  };

  // Portalled to <body>: the chat page wraps its content in a stacking context that would otherwise paint over this.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="connect-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="connect-title" className="text-base font-semibold text-[var(--text-primary)]">Connect an account</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Stored encrypted on our server and used only after you approve a specific action. The AI never sees it, and it is never typed into the chat.
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-full px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">✕</button>
        </div>

        <form onSubmit={submit} autoComplete="off" className="mt-4 space-y-3">
          <div>
            <label htmlFor="conn-service" className="block text-xs font-medium text-[var(--text-secondary)]">Service</label>
            <select id="conn-service" value={service} onChange={(e) => { setService(e.target.value); setValues({}); setSaved(null); setError(null); }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm outline-none">
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {spec ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">Can: {spec.actions.join(', ').toLowerCase()}.{spec.note ? ` ${spec.note}` : ''}</p> : null}
          </div>
          <div>
            <label htmlFor="conn-label" className="block text-xs font-medium text-[var(--text-secondary)]">Name it (the assistant sees this)</label>
            <input id="conn-label" type="text" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={spec ? `e.g. ${spec.name} — work` : ''}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm outline-none" />
          </div>
          {spec?.fields.map((f, i) => {
            const id = `conn-${f.name}`;
            return (
              <div key={f.name}>
                <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)]">{f.label}{f.secret ? ' 🔒' : ''}</label>
                {f.choices.length ? (
                  <select id={id} value={values[f.name] ?? f.choices[0]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm outline-none">
                    {f.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    id={id}
                    ref={i === 0 ? firstField : undefined}
                    type={f.secret ? 'password' : 'text'}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    autoComplete={f.secret ? 'new-password' : 'off'}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    required
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 font-mono text-sm outline-none"
                  />
                )}
                {f.help ? <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{f.help}</p> : null}
              </div>
            );
          })}
          <button type="submit" disabled={busy || !spec} className="btn-primary w-full text-sm disabled:opacity-50">{busy ? 'Saving…' : 'Save securely'}</button>
          {saved ? <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">{saved}</p> : null}
          {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null}
        </form>

        {accounts.length ? (
          <div className="mt-5 border-t border-[var(--border)] pt-3">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)]">Connected</h3>
            <ul className="mt-2 space-y-2">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-[var(--text-primary)]">{a.label}</span>{' '}
                    <span className="text-[11px] text-[var(--text-muted)]">{a.provider_name}{a.last_used_at ? ` · used ${new Date(a.last_used_at.replace(' ', 'T')).toLocaleDateString()}` : ''}</span>
                  </span>
                  <button type="button" onClick={() => void remove(a)} className="shrink-0 text-xs text-red-500 underline underline-offset-2">Remove</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
