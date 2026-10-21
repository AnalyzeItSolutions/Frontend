'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown, IconFolderPlus, IconLoader2, IconPlugConnected, IconUpload } from '@tabler/icons-react';
import { applyUIAction, createProject, getProjects, type ProjectSummary } from '../../lib/chatApi';

/** The model tags a project-less chat's proposals with this placeholder; it is not a real project. */
const PLACEHOLDER_PROJECT = 'default';

export function isNoticeWidget(widget: unknown): boolean {
  const w = widget as { metric?: string; provenance?: { source?: string }; props?: { metric?: string } } | undefined;
  return w?.metric === 'honesty' || w?.props?.metric === 'honesty' || w?.provenance?.source === 'AnalyzeIt honesty gate';
}

/**
 * "Add to dashboard" under a proposed widget. It always lands in a project that exists: the chat's own project,
 * the one the proposal names, or one you pick here (or a new one) — never the model's placeholder.
 */
export function AddToDashboard({
  actionId,
  proposalProjectId,
  chatProjectId,
  onAdded,
  apply: customApply,
  label = 'Add to dashboard',
  compact = false,
}: {
  actionId?: string;
  proposalProjectId?: string | null;
  chatProjectId?: string | null;
  onAdded: (projectId: string) => void;
  /** Used instead of applying a model proposal, e.g. to save a chat answer as widgets. */
  apply?: (projectId: string) => Promise<unknown>;
  label?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'choosing' | 'adding' | 'done' | 'error'>('idle');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [message, setMessage] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const real = (id?: string | null) => (id && id !== PLACEHOLDER_PROJECT ? id : null);
  const known = real(proposalProjectId) || real(chatProjectId);

  useEffect(() => {
    if (state !== 'choosing') return undefined;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setState('idle');
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [state]);

  const apply = async (projectId: string, name?: string) => {
    setState('adding');
    try {
      if (customApply) await customApply(projectId);
      else await applyUIAction(projectId, actionId || '', true);
      setMessage(name ? `Added to “${name}”.` : 'Added to your dashboard.');
      setState('done');
      onAdded(projectId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not add it.');
      setState('error');
    }
  };

  const start = async () => {
    if (known) return void apply(known);
    setState('adding');
    try {
      const list = await getProjects();
      setProjects(list);
      if (list.length === 0) return void (await createAndApply());
      if (list.length === 1) return void apply(list[0].id, list[0].name);
      setState('choosing');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not load your projects.');
      setState('error');
    }
  };

  const createAndApply = async () => {
    setState('adding');
    try {
      const created = await createProject('My dashboard');
      await apply(created.id, created.name);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create a project.');
      setState('error');
    }
  };

  return (
    <div className={`relative flex items-center gap-3 ${compact ? '' : 'justify-end px-1 pb-1'}`} ref={wrapRef}>
      {message ? (
        <span className={`text-[11px] ${state === 'error' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`} role={state === 'error' ? 'alert' : 'status'}>
          {message}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void start()}
        disabled={state === 'adding' || state === 'done'}
        className={compact ? 'inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-60' : 'btn-primary inline-flex items-center gap-1 text-[11px] disabled:opacity-60'}
      >
        {state === 'adding' ? <IconLoader2 size={12} className="animate-spin" /> : state === 'done' ? <IconCheck size={12} /> : null}
        {state === 'done' ? (compact ? 'Kept' : 'Added') : label}
        {!known && state !== 'done' && state !== 'adding' ? <IconChevronDown size={12} /> : null}
      </button>
      {state === 'choosing' ? (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl" role="menu">
          <p className="px-3 pt-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Add to which project?</p>
          <div className="max-h-56 overflow-y-auto py-1">
            {projects.slice(0, 12).map((p) => (
              <button key={p.id} type="button" role="menuitem" onClick={() => void apply(p.id, p.name)} className="block w-full truncate px-3 py-1.5 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                {p.name}
              </button>
            ))}
          </div>
          <button type="button" role="menuitem" onClick={() => void createAndApply()} className="flex w-full items-center gap-1.5 border-t border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
            <IconFolderPlus size={13} /> New project
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The "no data yet" notice is not a chart, so instead of an Add button it offers the way to get real data. */
export function NoDataNextSteps({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
      <button type="button" onClick={onUpload} className="btn-primary inline-flex items-center gap-1.5 text-[11px]">
        <IconUpload size={12} /> Upload a CSV or spreadsheet
      </button>
      <Link href="/connectors" className="btn-secondary inline-flex items-center gap-1.5 text-[11px]">
        <IconPlugConnected size={12} /> Connect a source
      </Link>
      <span className="text-[11px] text-[var(--text-muted)]">Then ask for the dashboard again — it will use your real numbers.</span>
    </div>
  );
}
