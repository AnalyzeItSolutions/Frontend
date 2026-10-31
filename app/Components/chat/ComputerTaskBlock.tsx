'use client';

import React, { useState } from 'react';
import { startComputerTask } from '../../lib/computerTasksApi';
import { ComputerTaskCard } from './ComputerTaskCard';

/**
 * A "Do it for me" proposal in the chat. The assistant only proposes a goal — it cannot start the task. The person reviews it (and may edit
 * it), then presses Start, which creates the task in their own session and swaps to the live view. Nothing runs until they press Start.
 */
export function ComputerTaskBlock({ goal, projectId }: { goal: string; projectId?: string }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState(goal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  if (taskId) return <ComputerTaskCard taskId={taskId} />;
  if (cancelled) return <p className="mt-3 text-xs text-[var(--text-muted)]">Task cancelled. Nothing ran.</p>;

  const start = async () => {
    const g = draft.trim();
    if (g.length < 3) {
      setError('Say what to do in a sentence.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const task = await startComputerTask(g, projectId);
      setTaskId(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the task.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="group" aria-label="Proposed task" className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Do it for me · in a cloud browser you watch</p>
      <label htmlFor="ct-goal" className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">What the agent will do (you can edit this)</label>
      <textarea
        id="ct-goal"
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={busy}
        maxLength={2000}
        className="mt-1 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => void start()} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Starting…' : 'Start'}</button>
        <button type="button" disabled={busy} onClick={() => setCancelled(true)} className="btn-secondary text-xs disabled:opacity-50">Cancel</button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-red-500">{error}</p> : null}
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        It signs in to nothing itself — you do any sign-in in the live view — and asks before anything that sends, buys or posts. You can Stop any time.
      </p>
    </div>
  );
}
