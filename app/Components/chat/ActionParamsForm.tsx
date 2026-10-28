'use client';

import React, { useState } from 'react';
import type { ActionField } from '../../lib/externalActions.mjs';
import { draftFromParams, draftProblems, paramsFromDraft } from '../../lib/externalActions.mjs';

/** The editor for one proposed action's parameters. Saving returns new content to review again; nothing is sent from here. */
export function ActionParamsForm({
  idPrefix,
  fields,
  params,
  busy,
  onSave,
  onCancel,
}: {
  idPrefix: string;
  fields: ActionField[];
  params: Record<string, string | number>;
  busy: boolean;
  onSave: (params: Record<string, string | number>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => draftFromParams(fields, params));
  const problems = draftProblems(fields, draft);

  const save = async () => {
    if (Object.keys(problems).length) return;
    if (await onSave(paramsFromDraft(fields, draft))) onCancel();
  };

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
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
                {f.required ? null : <option value="">—</option>}
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
        <button type="button" disabled={busy} onClick={onCancel} className="btn-secondary text-xs disabled:opacity-50">Cancel</button>
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">After saving you will review it once more. Nothing is sent until you approve.</p>
    </form>
  );
}
