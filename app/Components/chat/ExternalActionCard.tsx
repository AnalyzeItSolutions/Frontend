'use client';

import React, { useState } from 'react';
import type { ExternalAction } from '../../lib/externalActionsApi';
import { isFinal, riskLabel, safeLink, statusText } from '../../lib/externalActions.mjs';
import { ActionParamsForm } from './ActionParamsForm';

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
  const final = isFinal(action.status);
  const link = safeLink((action.result?.detail as { url?: unknown } | undefined)?.url);
  const tone = action.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : action.status === 'failed' ? 'text-red-500' : 'text-[var(--text-muted)]';

  const startEdit = () => setEditing(true);

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
        <ActionParamsForm idPrefix={`xa-${action.id}`} fields={action.fields} params={action.params} busy={busy} onSave={onSaveEdit} onCancel={() => setEditing(false)} />
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
