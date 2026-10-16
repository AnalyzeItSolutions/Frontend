'use client';

import { useCallback, useEffect, useState } from 'react';
import { changeLine, goalStatusLine, runGoalMessage } from '../../lib/goalsView.mjs';
import { createGoal, deleteGoal, listGoalRuns, listGoals, runGoalNow, updateGoal, type GoalEvery, type GoalRun, type StandingGoal } from '../../lib/goalsApi';

/** Questions the owner wants answered on a schedule, with what changed since the last answer. */
export function GoalsPanel({ projectId }: { projectId: string }) {
  const [goals, setGoals] = useState<StandingGoal[] | null>(null);
  const [max, setMax] = useState(5);
  const [question, setQuestion] = useState('');
  const [every, setEvery] = useState<GoalEvery>('weekly');
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [runs, setRuns] = useState<GoalRun[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await listGoals(projectId);
      setGoals(r.goals);
      setMax(r.max);
    } catch {
      setGoals(null);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!goals) return null;

  const guard = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await fn();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const add = () =>
    guard(async () => {
      await createGoal(projectId, { question: question.trim(), every, email });
      setQuestion('');
      await load();
    });

  const showRuns = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setRuns([]);
    try {
      setRuns(await listGoalRuns(projectId, id));
    } catch {
      setRuns([]);
    }
  };

  const runNow = (id: string) =>
    guard(async () => {
      try {
        setMessage(runGoalMessage(await runGoalNow(projectId, id)));
      } catch (err) {
        setMessage(runGoalMessage(null, { status: (err as { status?: number }).status, message: err instanceof Error ? err.message : '' }));
      }
      await load();
      if (open === id) setRuns(await listGoalRuns(projectId, id));
    });

  return (
    <section aria-label="Standing questions" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-[var(--text-primary)]">Standing questions</h3>
        <p className="text-xs text-[var(--text-muted)]">Get an answer on a schedule and see what changed since last time. Scheduled runs use the automatic checks, so open questions work best, like “What is going wrong with my payments?” or “What stands out in my data?”. Up to {max} per project.</p>
      </div>

      {goals.length ? (
        <ul className="divide-y divide-[var(--border)] text-sm">
          {goals.map((g) => (
            <li key={g.id} className="space-y-2 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">{g.question}</span>
                <span className="text-xs text-[var(--text-muted)]">{goalStatusLine(g)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={g.enabled} disabled={busy} onChange={(e) => void guard(async () => { await updateGoal(projectId, g.id, { enabled: e.target.checked }); await load(); })} />
                  On
                </label>
                <label className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={g.email} disabled={busy} onChange={(e) => void guard(async () => { await updateGoal(projectId, g.id, { email: e.target.checked }); await load(); })} />
                  Email changes
                </label>
                <button type="button" disabled={busy} onClick={() => void runNow(g.id)} className="btn-secondary text-xs disabled:opacity-50">Run now</button>
                <button type="button" onClick={() => void showRuns(g.id)} className="btn-secondary text-xs">{open === g.id ? 'Hide answers' : 'Past answers'}</button>
                <button type="button" disabled={busy} onClick={() => void guard(async () => { await deleteGoal(projectId, g.id); await load(); })} className="btn-secondary text-xs disabled:opacity-50">Remove</button>
              </div>
              {open === g.id ? (
                runs.length ? (
                  <ul className="space-y-2 rounded-lg bg-[var(--surface-2)] p-3 text-xs">
                    {runs.map((r) => (
                      <li key={r.id} className="space-y-1">
                        <div className="text-[var(--text-muted)]">{r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''} · {changeLine(r.change)}</div>
                        <p className="whitespace-pre-line text-[var(--text-secondary)]">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">No answers yet.</p>
                )
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {goals.length < max ? (
        <div className="flex flex-wrap items-center gap-2">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="e.g. What changed in revenue and why?" aria-label="Standing question"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs" />
          <select value={every} onChange={(e) => setEvery(e.target.value as GoalEvery)} aria-label="How often" className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-xs">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <label className="inline-flex items-center gap-1 text-xs">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
            Email me
          </label>
          <button type="button" disabled={busy || question.trim().length < 8} onClick={() => void add()} className="btn-primary text-xs disabled:opacity-50">Add</button>
        </div>
      ) : null}
      {message ? <p role="status" className="text-xs text-[var(--text-muted)]">{message}</p> : null}
    </section>
  );
}
