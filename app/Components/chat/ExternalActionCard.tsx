'use client';

import React, { useState } from 'react';
import type { ExternalAction } from '../../lib/externalActionsApi';
import { draftFromParams, draftProblems, isFinal, paramsFromDraft, riskLabel, safeLink, statusText } from '../../lib/externalActions.mjs';

/**
 * Something the assistant wants to do on one of your accounts. You see the exact content, can edit it, then approve or deny — right here.
 * The login is never in this card, in the chat, or in the assistant's context: it is sealed on the server and used only after you approve.
 */
export function ExternalActionCard({
  action,
  busy,
  error,
  onSaveEdit,
  onApprove,
  onDeny,
  onSaveFile,
}: {
  action: ExternalAction;
  busy: boolean;
  error?: string | null;
  onSaveEdit: (params: Record<string, string | number>) => Promise<boolean>;
  onApprove: () => void;
  onDeny: () => void;
  onSaveFile: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const problems = editing ? draftProblems(action.fields, draft) : {};
  const final = isFinal(action.status);
  const link = safeLink((action.result?.detail as { url?: unknown } | undefined)?.url);
  const tone = action.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : action.status === 'failed' ? 'text-red-500' : 'text-[var(--text-muted)]';

  const startEdit = () => {
    setDraft(draftFromParams(action.fields, action.params));
    setEditing(true);
  };
  const save = async () => {
    if (Object.keys(problems).length) return;
    if (await onSaveEdit(paramsFromDraft(action.fields, draft))) setEditing(false);
  };

  return (
    <div role="group" aria-label={`Proposed action: ${action.title}`} className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {action.status === 'pending' ? 'Needs your approval' : 'Action'} · {action.provider_name}
        </p>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{riskLabel(action.risk)}</span>
        {action.edited ? <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">Edited by you</span> : null}
      </div>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{action.title}</p>
      {action.account ? (
        <p className="text-xs text-[var(--text-muted)]">As <span className="text-[var(--text-secondary)]">{action.account.label}</span></p>
      ) : null}

      {editing ? (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {action.fields.map((f) => {
            const id = `xa-${action.id}-${f.name}`;
            const v = draft[f.name] ?? '';
            const set = (val: string) => setDraft((d) => ({ ...d, [f.name]: val }));
            return (
              <div key={f.name}>
                <label htmlFor={id} className="block text-xs font-medium text-[var(--text-secondary)]">
                  {f.label}{f.required ? '' : ' (optional)'}
                </label>
                {f.kind === 'longtext' || f.kind === 'json' ? (
                  <textarea id={id} rows={f.kind === 'longtext' ? 4 : 3} value={v} onChange={(e) => set(e.target.value)} disabled={busy}
                    className="mt-1 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]" />
                ) : f.kind === 'choice' ? (
                  <select id={id} value={v} onChange={(e) => set(e.target.value)} disabled={busy}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]">
                    {f.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input id={id} type="text" inputMode={f.kind === 'int' ? 'numeric' : undefined} value={v} onChange={(e) => set(e.target.value)} disabled={busy}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]" />
                )}
                <div className="mt-0.5 flex justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>{problems[f.name] ? <span role="alert" className="text-red-500">{problems[f.name]}</span> : f.help}</span>
                  {f.kind === 'longtext' || f.kind === 'text' ? <span>{v.length}/{f.max_len}</span> : null}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy || Object.keys(problems).length > 0} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button>
            <button type="button" disabled={busy} onClick={() => setEditing(false)} className="btn-secondary text-xs disabled:opacity-50">Cancel</button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">After saving you will review it once more. Nothing is sent until you approve.</p>
        </form>
      ) : (
        <dl className="mt-2 space-y-2">
          {action.fields.filter((f) => action.params[f.name] !== undefined && action.params[f.name] !== '').map((f) => (
            <div key={f.name}>
              <dt className="text-[11px] text-[var(--text-muted)]">{f.label}</dt>
              <dd className="whitespace-pre-wrap break-words rounded-lg bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text-primary)]">{String(action.params[f.name])}</dd>
            </div>
          ))}
        </dl>
      )}

      {!editing && action.status === 'pending' ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={onApprove} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Working…' : 'Approve and run'}</button>
          <button type="button" disabled={busy} onClick={startEdit} className="btn-secondary text-xs disabled:opacity-50">Edit</button>
          <button type="button" disabled={busy} onClick={onDeny} className="btn-secondary text-xs disabled:opacity-50">Deny</button>
        </div>
      ) : null}

      {!editing && action.status !== 'pending' ? (
        <div role="status" className="mt-3 text-xs">
          <p className={tone}>{statusText(action.status)}</p>
          {action.status === 'done' && action.result?.summary ? <p className="mt-1 text-[var(--text-secondary)]">{action.result.summary}</p> : null}
          {action.status === 'failed' && action.error ? <p className="mt-1 text-red-500">{action.error}</p> : null}
          {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline underline-offset-2 text-[var(--text-secondary)]">Open</a> : null}
          {action.status === 'done' && action.has_file ? (
            <button type="button" onClick={onSaveFile} className="mt-1 block underline underline-offset-2 text-[var(--text-secondary)]">Save the file (it has not been opened)</button>
          ) : null}
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-500">{error}</p> : null}
      {!final && !editing ? <p className="mt-2 text-[11px] text-[var(--text-muted)]">Expires if you do nothing. Your login stays sealed on the server and is never shown to the assistant.</p> : null}
    </div>
  );
}
