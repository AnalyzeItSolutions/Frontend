'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import {
  fetchProjectConnectors,
  revokeConnector,
  saveCustomSource,
  syncCustomSource,
  testCustomSource,
  type Connector,
  type CustomSource,
  type CustomSourceDraft,
  NO_AUTH,
  type CustomSourcePreview,
} from '../../lib/customObjectsApi';

const EMPTY: CustomSourceDraft = {
  name: '',
  source_type: 'rest_api',
  url: '',
  data_shape: 'flat_table',
  records_path: '$',
  field_mappings: [],
  auth: NO_AUTH,
};

const SHAPES: Array<{ id: CustomSourceDraft['data_shape']; label: string }> = [
  { id: 'flat_table', label: 'List of records' },
  { id: 'nested_json', label: 'Records inside an object' },
  { id: 'time_series', label: 'Dates with values' },
  { id: 'key_value', label: 'Keys and values' },
];

const input = 'mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm';

function hostOf(url?: string): string {
  try {
    return url ? new URL(url).host : '';
  } catch {
    return '';
  }
}

/** Public JSON endpoints and CSV links the person points the assistant at. Keys, when needed, are kept encrypted in the vault and never shown again. */
export function CustomSourcesPanel({ projectId }: { projectId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [sources, setSources] = useState<CustomSource[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomSourceDraft>(EMPTY);
  const [preview, setPreview] = useState<CustomSourcePreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'test' | 'save' | string | null>(null);

  const load = useCallback(async () => {
    const rows = await fetchProjectConnectors(projectId);
    setSources((rows as Array<Connector & { kind?: string }>).filter((r) => r.kind === 'custom') as unknown as CustomSource[]);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const csv = draft.source_type === 'csv_feed_url';
  const a = draft.auth;
  const keyOk =
    a.kind === 'none' ||
    (a.kind === 'api_key' && a.header.trim() !== '' && a.value !== '') ||
    (a.kind === 'bearer' && a.token !== '') ||
    (a.kind === 'basic' && a.username !== '' && a.password !== '');
  const ready = draft.name.trim() !== '' && /^https?:\/\//i.test(draft.url.trim()) && keyOk;
  const set = (patch: Partial<CustomSourceDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setPreview(null);
  };

  const close = () => {
    setOpen(false);
    setDraft(EMPTY);
    setPreview(null);
    setError('');
  };

  const runTest = async () => {
    setBusy('test');
    setError('');
    try {
      setPreview(await testCustomSource(projectId, draft));
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Could not fetch a sample.');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy('save');
    setError('');
    try {
      const created = await saveCustomSource(projectId, draft);
      let note = '';
      try {
        const r = await syncCustomSource(projectId, created.id);
        note = r.status === 'failed' ? ` First sync failed: ${r.error || 'unknown error'}` : ` ${r.record_count ?? 0} records read.`;
      } catch (err) {
        note = ` First sync failed: ${err instanceof Error ? err.message : 'unknown error'}`;
      }
      toast.success(`Added “${created.name}”.${note}`);
      close();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this source.');
    } finally {
      setBusy(null);
    }
  };

  const sync = async (s: CustomSource) => {
    setBusy(s.id);
    try {
      const r = await syncCustomSource(projectId, s.id);
      if (r.status === 'failed') toast.error(r.error || 'Sync failed');
      else toast.success(`${r.record_count ?? 0} records read.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s: CustomSource) => {
    const ok = await confirm({
      title: `Remove “${s.name}”?`,
      message: 'The source stops syncing. What it already added to memory stays until you delete it there.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setBusy(s.id);
    try {
      if (!(await revokeConnector(s.id))) throw new Error('Could not remove this source.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove this source.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="custom-sources-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="custom-sources-title" className="font-serif text-xl text-[var(--text-primary)]">Your own sources</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Point AnalyzeIt at a JSON address or a CSV link. It reads it read-only, keeps it in memory and re-reads it about once an hour. If the address needs a key, add it below: it is kept encrypted and is never shown again.
          </p>
        </div>
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--coral)] px-4 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--coral-dark)]">
            <IconPlus className="h-4 w-4" /> Add a source
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[var(--text-muted)]">
              Name
              <input className={input} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Exchange rates" maxLength={120} />
            </label>
            <label className="block text-xs text-[var(--text-muted)]">
              Kind
              <select className={input} value={draft.source_type} onChange={(e) => set({ source_type: e.target.value as CustomSourceDraft['source_type'] })}>
                <option value="rest_api">JSON address</option>
                <option value="csv_feed_url">CSV link</option>
              </select>
            </label>
          </div>
          <label className="block text-xs text-[var(--text-muted)]">
            Address
            <input className={input} value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://api.example.com/rates.json" inputMode="url" />
          </label>

          <div className="space-y-2">
            <label className="block text-xs text-[var(--text-muted)]">
              Key
              <select
                className={input}
                value={draft.auth.kind}
                onChange={(e) => set({ auth: { ...draft.auth, kind: e.target.value as CustomSourceDraft['auth']['kind'] } })}
              >
                <option value="none">None, the address is open</option>
                <option value="api_key">API key in a header</option>
                <option value="bearer">Bearer token</option>
                <option value="basic">Username and password</option>
              </select>
            </label>
            {draft.auth.kind === 'api_key' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input aria-label="Header name" className={`${input} font-mono`} value={draft.auth.header} placeholder="X-Api-Key" onChange={(e) => set({ auth: { ...draft.auth, header: e.target.value } })} />
                <input aria-label="Key" type="password" autoComplete="off" className={input} value={draft.auth.value} placeholder="Key" onChange={(e) => set({ auth: { ...draft.auth, value: e.target.value } })} />
              </div>
            ) : null}
            {draft.auth.kind === 'bearer' ? (
              <input aria-label="Token" type="password" autoComplete="off" className={input} value={draft.auth.token} placeholder="Token" onChange={(e) => set({ auth: { ...draft.auth, token: e.target.value } })} />
            ) : null}
            {draft.auth.kind === 'basic' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input aria-label="Username" autoComplete="off" className={input} value={draft.auth.username} placeholder="Username" onChange={(e) => set({ auth: { ...draft.auth, username: e.target.value } })} />
                <input aria-label="Password" type="password" autoComplete="off" className={input} value={draft.auth.password} placeholder="Password" onChange={(e) => set({ auth: { ...draft.auth, password: e.target.value } })} />
              </div>
            ) : null}
          </div>

          {!csv ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-[var(--text-muted)]">
                Shape of the answer
                <select className={input} value={draft.data_shape} onChange={(e) => set({ data_shape: e.target.value as CustomSourceDraft['data_shape'] })}>
                  {SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
              <label className="block text-xs text-[var(--text-muted)]">
                Where the records are
                <input className={`${input} font-mono`} value={draft.records_path} onChange={(e) => set({ records_path: e.target.value })} placeholder="$.data.items" />
              </label>
            </div>
          ) : null}

          {!csv ? (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-muted)]">Pick fields (optional). Leave empty to keep every field.</p>
              {draft.field_mappings.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                  <input aria-label="Column name" className={input} value={m.target_name} placeholder="column" onChange={(e) => set({ field_mappings: draft.field_mappings.map((x, j) => (j === i ? { ...x, target_name: e.target.value } : x)) })} />
                  <input aria-label="Path in the data" className={`${input} font-mono`} value={m.path} placeholder="$.price" onChange={(e) => set({ field_mappings: draft.field_mappings.map((x, j) => (j === i ? { ...x, path: e.target.value } : x)) })} />
                  <button type="button" aria-label="Remove field" className="mt-1 px-2 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={() => set({ field_mappings: draft.field_mappings.filter((_, j) => j !== i) })}>
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" className="text-xs font-medium text-[var(--coral)] hover:underline" onClick={() => set({ field_mappings: [...draft.field_mappings, { target_name: '', path: '', role: 'other' }] })}>
                + Add a field
              </button>
            </div>
          ) : null}

          {error ? <p role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}

          {preview ? (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs">
              <p className="mb-2 text-[var(--text-secondary)]">
                {preview.record_count.toLocaleString()} records found{preview.truncated ? ' (first 5,000 kept)' : ''}. First {preview.sample.length}:
              </p>
              {preview.sample.length ? (
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr>{Object.keys(preview.sample[0]).slice(0, 8).map((k) => <th key={k} className="pr-4 pb-1 font-medium text-[var(--text-muted)]">{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((row, i) => (
                      <tr key={i}>{Object.keys(preview.sample[0]).slice(0, 8).map((k) => <td key={k} className="pr-4 py-0.5">{String(row[k] ?? '')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[var(--danger)]">Nothing matched. Check the address and where the records are.</p>
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="px-3 py-2 text-xs text-[var(--text-muted)]">Cancel</button>
            <button type="button" disabled={!ready || busy !== null} onClick={runTest} className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50">
              {busy === 'test' ? 'Fetching…' : 'Test'}
            </button>
            <button type="button" disabled={!ready || !preview || preview.record_count === 0 || busy !== null} onClick={save} className="rounded-xl bg-[var(--coral)] px-4 py-2 text-xs font-semibold text-[var(--brand-ink)] disabled:opacity-50">
              {busy === 'save' ? 'Saving…' : 'Save & read it'}
            </button>
          </div>
        </div>
      ) : null}

      {sources.length === 0 && !open ? (
        <p className="text-xs text-[var(--text-muted)]">No sources of your own yet.</p>
      ) : null}
      <ul className="space-y-2">
        {sources.map((s) => {
          const failed = s.status === 'failed';
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                <p className="truncate text-[11px] font-mono text-[var(--text-muted)]">
                  {hostOf(s.config?.guided?.url)}
                  {s.last_synced_at ? ` · read ${new Date(s.last_synced_at).toLocaleString()}` : ' · not read yet'}
                  {s.last_sync_result?.record_count != null ? ` · ${s.last_sync_result.record_count} records` : ''}
                </p>
                {failed ? <p className="text-[11px] text-[var(--danger)]">{s.last_sync_result?.error || 'The last read failed.'}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {s.last_sync_result?.object ? (
                  <Link href={`/objects?project=${encodeURIComponent(projectId)}&object=${encodeURIComponent(s.last_sync_result.object)}`} className="text-xs font-medium text-[var(--coral)] hover:underline">
                    Open as table
                  </Link>
                ) : null}
                <button type="button" disabled={busy === s.id} onClick={() => sync(s)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-xs font-medium disabled:opacity-50">
                  <IconRefresh className={`h-3.5 w-3.5 ${busy === s.id ? 'animate-spin' : ''}`} /> Sync
                </button>
                <button type="button" disabled={busy === s.id} onClick={() => remove(s)} aria-label={`Remove ${s.name}`} className="inline-flex min-h-9 items-center rounded-xl px-2 text-[var(--text-muted)] hover:text-[var(--danger)] disabled:opacity-50">
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
