'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  computerTaskShot, getComputerTask, resumeComputerTask, stopComputerTask,
  type ComputerTask,
} from '../../lib/computerTasksApi';
import { isTaskFinal, pollDelayMs, stepLabel, taskControls, taskStatusText } from '../../lib/computerTasks.mjs';

/**
 * The live view of a "Do it for me" task: the cloud browser's latest screenshot, the steps as they happen, and the controls.
 * The agent never signs in and never commits without a yes — so this card's two prompts are "sign in yourself, then Continue"
 * and "approve this step". Stop ends it at once. Everything is the person's; the agent only proposes and reports.
 */
export function ComputerTaskCard({ taskId, onDone }: { taskId: string; onDone?: (task: ComputerTask) => void }) {
  const [task, setTask] = useState<ComputerTask | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shotRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const refreshShot = useCallback(async () => {
    try {
      const url = await computerTaskShot(taskId);
      if (!alive.current) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (url) {
        if (shotRef.current) URL.revokeObjectURL(shotRef.current);
        shotRef.current = url;
        setShot(url);
      }
    } catch {
      /* a missed frame is not worth surfacing */
    }
  }, [taskId]);

  const tick = useCallback(async () => {
    try {
      const t = await getComputerTask(taskId);
      if (!alive.current) return;
      setTask(t);
      setError(null);
      if (t.has_screenshot) void refreshShot();
      if (isTaskFinal(t.status)) {
        onDone?.(t);
        return;
      }
      const delay = pollDelayMs(t.status);
      if (delay) timer.current = setTimeout(() => void tick(), delay);
    } catch (err) {
      if (!alive.current) return;
      setError(err instanceof Error ? err.message : 'Lost contact with the task.');
      timer.current = setTimeout(() => void tick(), 4000);
    }
  }, [taskId, onDone, refreshShot]);

  useEffect(() => {
    alive.current = true;
    void tick();
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (shotRef.current) URL.revokeObjectURL(shotRef.current);
    };
  }, [tick]);

  const act = async (fn: () => Promise<ComputerTask>) => {
    setBusy(true);
    setError(null);
    try {
      const t = await fn();
      setTask(t);
      if (!isTaskFinal(t.status)) void tick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  if (!task) return <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]">Starting the task…</div>;

  const c = taskControls(task);
  const waiting = task.status === 'needs_you' ? task.waiting : null;

  return (
    <div role="group" aria-label={`Task: ${task.goal}`} className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Do it for me · in a cloud browser</p>
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{task.goal}</p>
        </div>
        {c.stop ? (
          <button type="button" disabled={busy} onClick={() => void act(() => stopComputerTask(task.id))}
            className="shrink-0 rounded-lg border border-red-500/40 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50">
            Stop everything
          </button>
        ) : null}
      </div>

      <div className="relative bg-black/80">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Live view of the task" className="block max-h-[420px] w-full object-contain" />
        ) : (
          <div className="flex h-48 items-center justify-center text-xs text-white/60">Waiting for the first frame…</div>
        )}
        {task.status === 'running' ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
          </span>
        ) : null}
      </div>

      <div className="px-3 py-2">
        <p className={`text-xs ${task.status === 'failed' || task.status === 'expired' ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
          {taskStatusText(task)}
        </p>

        {waiting ? (
          <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
            <p className="text-sm text-[var(--text-primary)]">{waiting.reason}</p>
            {waiting.kind === 'pause' ? (
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Sign in yourself in the view above. The agent never sees your password. Then press Continue.</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {c.continue ? <button type="button" disabled={busy} onClick={() => void act(() => resumeComputerTask(task.id, 'continue'))} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Working…' : 'Continue'}</button> : null}
              {c.approve ? <button type="button" disabled={busy} onClick={() => void act(() => resumeComputerTask(task.id, 'continue'))} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Working…' : 'Approve this step'}</button> : null}
              {c.deny ? <button type="button" disabled={busy} onClick={() => void act(() => resumeComputerTask(task.id, 'deny'))} className="btn-secondary text-xs disabled:opacity-50">Don’t do this</button> : null}
            </div>
          </div>
        ) : null}

        {task.steps.length ? (
          <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {task.steps.slice(-12).map((s) => (
              <li key={s.n} className="flex items-baseline gap-2 text-xs text-[var(--text-secondary)]">
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{s.n}</span>
                <span className="truncate">{stepLabel(s)}{s.verdict === 'ask' ? ' · asked you' : s.verdict === 'pause' ? ' · handed to you' : ''}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {error ? <p role="alert" className="mt-2 text-xs text-red-500">{error}</p> : null}
        {!isTaskFinal(task.status) ? (
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">It never types a password and asks before anything that sends, buys, posts or deletes. You can Stop any time.</p>
        ) : null}
      </div>
    </div>
  );
}
