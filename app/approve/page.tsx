'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuthSession, fetchMe, getAuthHeaders, getStoredToken, type UserProfile } from '../lib/auth';
import { accessHeadline, approvalPath, dataHeadline, explainAccessError, parseApproval } from '../lib/approvals.mjs';
import { decideBulkChange, undoBulkChange } from '../lib/agentAccessApi';
import { BulkChangeCard, type BulkChangeStatus } from '../Components/chat/BulkChangeCard';
import { explainBulkError, parseBulkProposal, type BulkProposal } from '../lib/bulkChange.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Table = {
  api_name: string;
  label: string;
  records: number;
  source: string;
  fields: { api_name: string; type: string }[];
  access: string;
  sample?: { columns: string[]; values: string[] }[];
};
type AccessView = { id: string; status: string; client_name: string; project_id: string; project_name: string; reason: string | null; requested_objects: string[] | null; tables: Table[] };
type ChangeView = { id: string; status: string; proposal: unknown; client_name?: string | null; result?: { changed?: number; skipped?: number } | null };

const card = 'w-full max-w-xl rounded-2xl border border-[#E3836C]/20 bg-white/70 dark:bg-white/[0.03] p-6 shadow-sm';

function AccessReview({ id, onGone }: { id: string; onGone: () => void }) {
  const [view, setView] = useState<AccessView | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [whole, setWhole] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'working' | 'done' | 'gone'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`${API_BASE}/v1/ai-access-requests/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (cancelled) return;
      if (!res.ok) {
        setState('gone');
        return;
      }
      const v = (await res.json()) as AccessView;
      setView(v);
      setPicked(Object.fromEntries(v.tables.map((t) => [t.api_name, true])));
      setState(v.status === 'pending' ? 'ready' : 'done');
      if (v.status !== 'pending') setMessage(v.status === 'allowed' ? 'Already allowed.' : v.status === 'denied' ? 'You said no to this request.' : 'This request has expired.');
    })().catch(() => !cancelled && setState('gone'));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function decide(allow: boolean) {
    if (!view) return;
    setState('working');
    setError('');
    const objects = view.tables.filter((t) => picked[t.api_name]).map((t) => t.api_name);
    const res = await fetch(`${API_BASE}/v1/ai-access-requests/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ allow, objects: whole ? null : objects, whole_project: allow && whole }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(explainAccessError(res.status, typeof body.detail === 'string' ? body.detail : ''));
      setState('ready');
      return;
    }
    setMessage(allow ? `Done. ${view.client_name} can now read ${whole ? 'this project' : `${objects.length} ${objects.length === 1 ? 'table' : 'tables'}`}. Go back to your assistant and tell it to continue.` : 'Okay, nothing was shared.');
    setState('done');
  }

  if (state === 'loading') return <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Loading" />;
  if (state === 'gone' || !view) return <Gone onGone={onGone} />;
  const count = Object.values(picked).filter(Boolean).length;
  return (
    <div className="text-[#2B2620] dark:text-[#EDE6DD]">
      <h1 className="text-lg font-semibold">{view.client_name} wants to read data in “{view.project_name}”</h1>
      {view.reason ? <p className="mt-2 text-sm"><span className="text-[#4A4238]/60 dark:text-[#91867E]">It says:</span> {view.reason}</p> : null}
      <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">This is what it would be able to read. Nothing is shared until you allow it, and you can turn it off again in the project’s AI data access settings.</p>

      {state !== 'done' ? (
        <>
          <ul className="mt-4 space-y-3">
            {view.tables.map((t) => (
              <li key={t.api_name} className="rounded-xl border border-[#E3836C]/20 p-3 text-sm">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={Boolean(picked[t.api_name])} disabled={whole} onChange={(e) => setPicked((p) => ({ ...p, [t.api_name]: e.target.checked }))} />
                  <span className="min-w-0">
                    <span className="font-medium">{t.label}</span>{' '}
                    <span className="text-xs text-[#4A4238]/60 dark:text-[#91867E]">{t.records.toLocaleString()} records{t.source.startsWith('connector') ? ' · from a connected source' : ''}</span>
                    <span className="mt-1 block text-xs text-[#4A4238]/70 dark:text-[#91867E]">Fields: {t.fields.map((f) => f.api_name).join(', ') || 'none'}</span>
                  </span>
                </label>
                {t.sample?.length ? (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[#4A4238]/60 dark:text-[#91867E]">{t.sample[0].columns.map((c) => <th key={c} className="py-0.5 pr-3 font-mono font-normal">{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {t.sample.map((r, i) => (
                          <tr key={i}>{r.values.map((v, j) => <td key={j} className="py-0.5 pr-3">{v}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-1 text-[11px] text-[#4A4238]/60 dark:text-[#91867E]">A few example rows, shown only to you.</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {view.tables.length > 1 || whole ? (
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={whole} onChange={(e) => setWhole(e.target.checked)} />
              <span>Allow everything in this project, including tables I add later</span>
            </label>
          ) : null}
          {error ? <p role="alert" className="mt-3 text-sm text-red-600 dark:text-[#D97870]">{error}</p> : null}
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" disabled={state === 'working' || (!whole && count === 0)} onClick={() => decide(true)} className="rounded-lg bg-[#E3836C] px-4 py-2.5 text-sm font-semibold text-[#1a0f0b] hover:bg-[#ED967F] disabled:opacity-60">
              {state === 'working' ? 'Saving…' : accessHeadline(view.client_name, count, whole)}
            </button>
            <button type="button" disabled={state === 'working'} onClick={() => decide(false)} className="rounded-lg border border-[#E3836C]/25 px-4 py-2.5 text-sm hover:bg-[#E3836C]/10 disabled:opacity-60">Don’t allow</button>
          </div>
        </>
      ) : (
        <p role="status" className="mt-4 text-sm">{message}</p>
      )}
    </div>
  );
}


type DataView = {
  id: string;
  kind: 'import' | 'kit';
  status: string;
  client_name: string;
  project_id: string;
  project_name: string;
  filename?: string | null;
  snapshot: {
    rows: number;
    columns?: { api_name: string; label?: string; type: string }[];
    sample?: string[][];
    notes?: string[];
    truncated?: boolean;
    kit?: string;
    name?: string;
    description?: string;
    tables?: { api_name: string; label: string; fields: number; sample_rows: number }[];
    try_asking?: string[];
    note?: string;
  };
  result?: { tables?: string[]; rows?: number } | null;
};

function DataReview({ id }: { id: string }) {
  const [view, setView] = useState<DataView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'working' | 'done' | 'gone'>('loading');
  const [allowRead, setAllowRead] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`${API_BASE}/v1/data-proposals/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (cancelled) return;
      if (!res.ok) return setState('gone');
      const v = (await res.json()) as DataView;
      setView(v);
      if (v.status === 'pending') setState('ready');
      else {
        setMessage(v.status === 'applied' ? 'Already added.' : v.status === 'rejected' ? 'You said no to this.' : 'This request has expired.');
        setState('done');
      }
    })().catch(() => !cancelled && setState('gone'));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function decide(approve: boolean) {
    if (!view) return;
    setState('working');
    setError('');
    const res = await fetch(`${API_BASE}/v1/data-proposals/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ approve, allow_read: allowRead }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(explainAccessError(res.status, typeof body.detail === 'string' ? body.detail : ''));
      setState('ready');
      return;
    }
    const out = (await res.json()) as { rows?: number };
    setMessage(approve ? `Added${out.rows ? ` ${out.rows.toLocaleString()} rows` : ''} to “${view.project_name}”.${allowRead ? ` ${view.client_name} can read it now: go back and tell it to continue.` : ''}` : 'Okay, nothing was added.');
    setState('done');
  }

  if (state === 'loading') return <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Loading" />;
  if (state === 'gone' || !view) return <Gone onGone={() => {}} />;
  const snap = view.snapshot;
  return (
    <div className="text-[#2B2620] dark:text-[#EDE6DD]">
      <h1 className="text-lg font-semibold">{view.client_name} wants to add data to “{view.project_name}”</h1>
      <p className="mt-2 text-sm font-medium">{dataHeadline(view.client_name, snap)}</p>
      {snap.description ? <p className="mt-1 text-sm text-[#4A4238]/70 dark:text-[#91867E]">{snap.description}</p> : null}
      <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Nothing has been added yet. {snap.kit ? 'This is made-up example data, and you can remove it in one click later.' : 'This is what it would create from the data you gave it.'}</p>

      {snap.columns ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#E3836C]/20 p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#4A4238]/60 dark:text-[#91867E]">
                {snap.columns.map((c) => (
                  <th key={c.api_name} className="py-1 pr-3 font-normal"><span className="font-mono">{c.api_name}</span> <span className="opacity-70">({c.type})</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(snap.sample || []).map((r, i) => (
                <tr key={i}>{r.map((v, j) => <td key={j} className="py-0.5 pr-3">{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-[#4A4238]/60 dark:text-[#91867E]">First {snap.sample?.length || 0} of {snap.rows.toLocaleString()} rows.{snap.truncated ? ' The file was cut at the row limit.' : ''}</p>
          {(snap.notes || []).map((n) => <p key={n} className="mt-1 text-[11px] text-[#4A4238]/70 dark:text-[#91867E]">{n}</p>)}
        </div>
      ) : null}
      {snap.tables ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {snap.tables.map((t) => <li key={t.api_name}>{t.label}: {t.sample_rows} rows, {t.fields} fields</li>)}
        </ul>
      ) : null}

      {state === 'done' ? (
        <p role="status" className="mt-4 text-sm">{message}</p>
      ) : (
        <>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={allowRead} onChange={(e) => setAllowRead(e.target.checked)} />
            <span>Also let {view.client_name} read the new table (it already has this data from the chat)</span>
          </label>
          {error ? <p role="alert" className="mt-3 text-sm text-red-600 dark:text-[#D97870]">{error}</p> : null}
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" disabled={state === 'working'} onClick={() => decide(true)} className="rounded-lg bg-[#E3836C] px-4 py-2.5 text-sm font-semibold text-[#1a0f0b] hover:bg-[#ED967F] disabled:opacity-60">
              {state === 'working' ? 'Adding…' : 'Add this data'}
            </button>
            <button type="button" disabled={state === 'working'} onClick={() => decide(false)} className="rounded-lg border border-[#E3836C]/25 px-4 py-2.5 text-sm hover:bg-[#E3836C]/10 disabled:opacity-60">Don’t add</button>
          </div>
        </>
      )}
    </div>
  );
}

function ChangeReview({ id, project, onGone }: { id: string; project: string; onGone: () => void }) {
  const [proposal, setProposal] = useState<BulkProposal | null>(null);
  const [client, setClient] = useState<string>('');
  const [status, setStatus] = useState<BulkChangeStatus>('pending');
  const [result, setResult] = useState<{ changed?: number; skipped?: number; restored?: number; left_alone?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`${API_BASE}/v1/projects/${encodeURIComponent(project)}/actions/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (cancelled) return;
      if (!res.ok) return setGone(true);
      const v = (await res.json()) as ChangeView;
      const p = parseBulkProposal(v.proposal);
      if (!p) return setGone(true);
      setProposal(p);
      setClient(v.client_name || 'An AI assistant');
      setStatus((['pending', 'applied', 'rejected', 'undone'].includes(v.status) ? v.status : 'error') as BulkChangeStatus);
      setResult(v.result ?? null);
    })().catch(() => !cancelled && setGone(true)).finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, project]);

  async function decide(approved: boolean) {
    setStatus('applying');
    setError(null);
    try {
      const out = await decideBulkChange(project, id, approved);
      setResult(out.bulk ?? null);
      setStatus(approved ? 'applied' : 'rejected');
    } catch (e) {
      setStatus('pending');
      setError(explainBulkError((e as { status?: number }).status ?? 0, e instanceof Error ? e.message : ''));
    }
  }

  async function undo() {
    setStatus('undoing');
    setError(null);
    try {
      const out = await undoBulkChange(project, id);
      setResult(out.bulk);
      setStatus('undone');
    } catch (e) {
      setStatus('applied');
      setError(explainBulkError((e as { status?: number }).status ?? 0, e instanceof Error ? e.message : ''));
    }
  }

  if (loading) return <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Loading" />;
  if (gone || !proposal) return <Gone onGone={onGone} />;
  return (
    <div className="text-[#2B2620] dark:text-[#EDE6DD]">
      <h1 className="text-lg font-semibold">{client} suggests a change to your data</h1>
      <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Nothing has changed yet. Review exactly what would happen, then approve or reject it.</p>
      <BulkChangeCard projectId={project} proposal={proposal} status={status} result={result} error={error} onApprove={() => void decide(true)} onReject={() => void decide(false)} onUndo={() => void undo()} />
    </div>
  );
}

function Gone({ onGone }: { onGone: () => void }) {
  void onGone;
  return (
    <div className="text-center">
      <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">This link is no longer valid</h1>
      <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">It may have expired, or it belongs to a different account. Ask your assistant to prepare it again.</p>
      <Link href="/" className="mt-5 inline-block text-xs font-mono uppercase tracking-wider text-[#E3836C] hover:text-[#ED967F]">Back to analyzeit.in</Link>
    </div>
  );
}

function ApproveInner() {
  const router = useRouter();
  const [what, setWhat] = useState<ReturnType<typeof parseApproval>>(null);
  const [stage, setStage] = useState<'checking' | 'invalid' | 'ready'>('checking');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const parsed = parseApproval(window.location.search);
    setWhat(parsed);
    if (!parsed) return setStage('invalid');
    if (!getStoredToken()) {
      router.replace(`/login?next=${encodeURIComponent(approvalPath(parsed))}`);
      return;
    }
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        clearAuthSession();
        router.replace(`/login?next=${encodeURIComponent(approvalPath(parsed))}`);
        return;
      }
      setUser(me);
      setStage('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F3EDE4] dark:bg-[#171514] px-6 py-10">
      <div className={card}>
        {stage === 'checking' && <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Checking your account" />}
        {stage === 'invalid' && <Gone onGone={() => {}} />}
        {stage === 'ready' && what?.kind === 'access' && <AccessReview id={what.id} onGone={() => {}} />}
        {stage === 'ready' && what?.kind === 'data' && <DataReview id={what.id} />}
        {stage === 'ready' && what?.kind === 'change' && <ChangeReview id={what.id} project={what.project} onGone={() => {}} />}
        {stage === 'ready' && user?.email ? <p className="mt-6 text-center text-xs text-[#4A4238]/50 dark:text-[#91867E]">Signed in as {user.email}</p> : null}
      </div>
    </main>
  );
}

export default function ApprovePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3EDE4] dark:bg-[#171514]" />}>
      <ApproveInner />
    </Suspense>
  );
}
