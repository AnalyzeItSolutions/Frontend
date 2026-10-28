'use client';

import React, { useState } from 'react';
import type { TaskPlan, TaskPlanStep } from '../../lib/externalActionsApi';
import { isPlanFinal, planStatusText, riskLabel, safeLink, splitStepRefs, stepStatusText } from '../../lib/externalActions.mjs';
import { ActionParamsForm } from './ActionParamsForm';

function WithRefs({ value }: { value: string | number }) {
  return (
    <>
      {splitStepRefs(value).map((part, i) =>
        part.ref ? (
          <span key={i} className="rounded bg-[var(--surface-2)] px-1 font-mono text-[12px] text-[var(--text-secondary)]" title={`Filled in from step ${part.ref.step} just before this step runs`}>
            step {part.ref.step} {part.ref.key}
          </span>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        ),
      )}
    </>
  );
}

function stepTone(status: TaskPlanStep['status']): string {
  if (status === 'done') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'failed') return 'text-red-500';
  return 'text-[var(--text-muted)]';
}

/**
 * Several things the assistant wants to do, in order, on your own accounts. You see every step's exact content, can edit any step,
 * then approve the whole plan once. Steps run one after another and stop at the first one that fails; later steps are never sent.
 */
export function TaskPlanCard({
  plan,
  busy,
  error,
  onSaveStep,
  onApprove,
  onDeny,
}: {
  plan: TaskPlan;
  busy: boolean;
  error?: string | null;
  onSaveStep: (step: number, params: Record<string, string | number>) => Promise<boolean>;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const pending = plan.status === 'pending';
  const final = isPlanFinal(plan.status);
  const tone = plan.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : plan.status === 'failed' ? 'text-red-500' : 'text-[var(--text-muted)]';

  return (
    <div role="group" aria-label={`Proposed plan: ${plan.title}`} className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {pending ? 'Needs your approval' : 'Plan'} · {plan.steps.length} steps
        </p>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{riskLabel(plan.risk)}</span>
        {plan.edited ? <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">Edited by you</span> : null}
      </div>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{plan.title}</p>

      <ol className="mt-2 space-y-2">
        {plan.steps.map((s) => {
          const link = safeLink((s.result?.detail as { url?: unknown } | undefined)?.url);
          return (
            <li key={s.n} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="mr-1 font-mono text-[11px] text-[var(--text-muted)]">{s.n}.</span>
                  {s.title} <span className="text-xs text-[var(--text-muted)]">· {s.provider_name}{s.account ? ` as ${s.account.label}` : ''}</span>
                </p>
                {!pending ? <span role="status" className={`text-[11px] ${stepTone(s.status)}`}>{stepStatusText(s.status)}</span> : null}
              </div>

              {editing === s.n ? (
                <ActionParamsForm
                  idPrefix={`tp-${plan.id}-${s.n}`}
                  fields={s.fields}
                  params={s.params}
                  busy={busy}
                  onSave={(params) => onSaveStep(s.n, params)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <dl className="mt-1 space-y-1">
                  {s.fields.filter((f) => s.params[f.name] !== undefined && s.params[f.name] !== '').map((f) => (
                    <div key={f.name}>
                      <dt className="text-[11px] text-[var(--text-muted)]">{f.label}</dt>
                      <dd className="whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]"><WithRefs value={s.params[f.name]} /></dd>
                    </div>
                  ))}
                </dl>
              )}

              {pending && editing === null ? (
                <button type="button" disabled={busy} onClick={() => setEditing(s.n)} className="mt-1 text-xs underline underline-offset-2 text-[var(--text-secondary)] disabled:opacity-50">
                  Edit step {s.n}
                </button>
              ) : null}
              {s.status === 'done' && s.result?.summary ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.result.summary}</p> : null}
              {s.error ? <p className="mt-1 text-xs text-red-500">{s.error}</p> : null}
              {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs underline underline-offset-2 text-[var(--text-secondary)]">Open</a> : null}
            </li>
          );
        })}
      </ol>

      {pending && editing === null ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={onApprove} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Working…' : 'Approve and run all'}</button>
          <button type="button" disabled={busy} onClick={onDeny} className="btn-secondary text-xs disabled:opacity-50">Deny</button>
        </div>
      ) : null}
      {!pending ? <p role="status" className={`mt-3 text-xs ${tone}`}>{planStatusText(plan.status, plan.steps)}</p> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-red-500">{error}</p> : null}
      {!final ? (
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Steps run in order and stop at the first one that fails. Expires if you do nothing. Your logins stay sealed on the server and are never shown to the assistant.
        </p>
      ) : null}
    </div>
  );
}
