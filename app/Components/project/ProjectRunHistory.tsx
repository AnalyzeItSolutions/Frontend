'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRun, listProjectRuns, type ProjectRunSummary } from '../../lib/chatApi';
import { relativeTime } from '../../lib/projectHome.mjs';

type RunDetail = { messages?: Array<{ role?: string; content?: string }> };

/** The last questions asked on this project. Opening one shows the question and the answer it got. */
export function ProjectRunHistory({ projectId, unavailableNote, researchHref }: { projectId: string; unavailableNote: string; researchHref: string }) {
  const [runs, setRuns] = useState<ProjectRunSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, RunDetail | 'loading' | 'error'>>({});

  useEffect(() => {
    let cancelled = false;
    listProjectRuns(projectId)
      .then((rows) => {
        if (!cancelled) setRuns(rows);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const toggle = (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (details[id] && details[id] !== 'error') return;
    setDetails((d) => ({ ...d, [id]: 'loading' }));
    getRun(id)
      .then((run: RunDetail) => setDetails((d) => ({ ...d, [id]: run })))
      .catch(() => setDetails((d) => ({ ...d, [id]: 'error' })));
  };

  if (failed) {
    return <p className="border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text-muted)]">{unavailableNote}</p>;
  }
  if (!runs) return <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">Loading recent questions…</p>;

  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Recent questions</h3>
      {runs.length === 0 ? (
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Nothing asked on this project yet. <Link href={researchHref} className="underline">Ask the first question</Link>.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {runs.map((run) => {
            const detail = details[run.id];
            const answer =
              detail && detail !== 'loading' && detail !== 'error'
                ? [...(detail.messages || [])].reverse().find((m) => m.role === 'assistant')?.content
                : undefined;
            const open = openId === run.id;
            return (
              <li key={run.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  onClick={() => toggle(run.id)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left"
                >
                  <span className="line-clamp-2 text-xs text-[var(--text-primary)]">{run.question || 'Question not kept'}</span>
                  <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                    {run.status && run.status !== 'completed' ? `${run.status} · ` : ''}
                    {relativeTime(run.created_at || '') || ''}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-[var(--border)] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {detail === 'loading' || !detail ? 'Loading…' : null}
                    {detail === 'error' ? 'Could not open this run. It may have expired.' : null}
                    {detail && detail !== 'loading' && detail !== 'error' ? (
                      answer ? <p className="max-h-64 overflow-y-auto whitespace-pre-wrap">{answer}</p> : <p>No answer was kept for this question.</p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
