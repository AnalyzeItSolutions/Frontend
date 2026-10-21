'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconFolder,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import type { ProjectSummary } from '../../lib/chatApi';

type SortKey = 'newest' | 'oldest' | 'name' | 'widgets';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name', label: 'Name' },
  { key: 'widgets', label: 'Most widgets' },
];

function createdLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function WorkspacesPanel({
  projects,
  activeProjectId,
  projectLimit,
  planLabel,
  isTopPlan,
  loading,
  duplicatingId,
  onClose,
  onOpen,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
  onBulkDelete,
}: {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  projectLimit: number | null;
  planLabel: string;
  isTopPlan: boolean;
  loading: boolean;
  duplicatingId: string | null;
  onClose: () => void;
  onOpen: (project: ProjectSummary) => void;
  onNew: () => void;
  onRename: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
  onDuplicate: (project: ProjectSummary) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Connector-made projects have their own allowance and do not count against the plan.
  const used = projects.filter((p) => p.created_via !== 'connector').length;
  const hasLimit = typeof projectLimit === 'number' && projectLimit > 0;
  const atLimit = hasLimit && used >= (projectLimit as number);
  const nearLimit = hasLimit && !atLimit && used >= Math.ceil((projectLimit as number) * 0.8);
  const pct = hasLimit ? Math.min(100, Math.round((used / (projectLimit as number)) * 100)) : 0;
  const barColor = atLimit ? 'var(--danger)' : nearLimit ? '#D98F3F' : 'var(--coral)';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) => p.name.toLowerCase().includes(q));
    const time = (p: ProjectSummary) => new Date(p.created_at || 0).getTime() || 0;
    const sorted = [...list];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'widgets') sorted.sort((a, b) => (b.widget_count ?? 0) - (a.widget_count ?? 0));
    else if (sort === 'oldest') sorted.sort((a, b) => time(a) - time(b));
    else sorted.sort((a, b) => time(b) - time(a));
    return sorted;
  }, [projects, query, sort]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
    setConfirmBulk(false);
  };

  const runBulk = async () => {
    setBulkBusy(true);
    try {
      await onBulkDelete([...selected]);
      stopSelecting();
    } finally {
      setBulkBusy(false);
    }
  };

  const freeAfter = hasLimit ? Math.max(0, (projectLimit as number) - Math.max(0, used - [...selected].filter((id) => projects.find((p) => p.id === id)?.created_via !== 'connector').length)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Projects"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--coral)]/15 text-[var(--coral)]">
              <IconFolder size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--text-primary)]">Projects</h3>
              <p className="text-xs text-[var(--text-muted)]">Open, organise or clear out your projects</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <IconX size={16} />
          </button>
        </div>

        {hasLimit ? (
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                {used} of {projectLimit} projects used
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">{planLabel} plan</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={projectLimit as number}
              aria-valuenow={used}
              aria-label="Projects used"
              className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]"
            >
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            {atLimit ? (
              <p className="text-xs text-[var(--text-secondary)]">
                You are at your {planLabel} limit, so New and Duplicate are paused.{' '}
                {selecting ? 'Tick the projects you no longer need, then delete them.' : (
                  <>
                    <button type="button" onClick={() => setSelecting(true)} className="cursor-pointer underline underline-offset-2 hover:text-[var(--coral)]">
                      Select projects to clear out
                    </button>
                    {isTopPlan ? '.' : (
                      <>
                        {' '}or{' '}
                        <Link href="/billing" className="underline underline-offset-2 hover:text-[var(--coral)]">upgrade</Link>.
                      </>
                    )}
                  </>
                )}
              </p>
            ) : nearLimit ? (
              <p className="text-xs text-[var(--text-muted)]">{(projectLimit as number) - used} slot{(projectLimit as number) - used === 1 ? '' : 's'} left.</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Filter by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort projects"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-xs text-[var(--text-primary)]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs ${selecting ? 'border-[var(--coral)] text-[var(--coral)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            {selecting ? 'Done' : 'Select'}
          </button>
        </div>

        <div className="max-h-[46vh] space-y-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-8 text-center text-xs text-[var(--text-muted)]">Loading projects…</p>
          ) : visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">{query ? 'No projects match this filter.' : 'No projects yet.'}</p>
            </div>
          ) : (
            visible.map((proj) => {
              const isActive = activeProjectId === proj.id;
              const isSelected = selected.has(proj.id);
              return (
                <div
                  key={proj.id}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    isSelected
                      ? 'border-[var(--danger)]/50 bg-[var(--danger)]/10'
                      : isActive
                        ? 'border-[var(--coral)]/30 bg-[var(--surface-2)]'
                        : 'border-transparent hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {selecting ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Select ${proj.name}`}
                      onClick={() => toggle(proj.id)}
                      className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border ${isSelected ? 'border-[var(--danger)] bg-[var(--danger)] text-white' : 'border-[var(--border)]'}`}
                    >
                      {isSelected ? <IconCheck size={11} /> : null}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => (selecting ? toggle(proj.id) : onOpen(proj))}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium text-[var(--text-primary)]">{proj.name}</span>
                      {isActive ? (
                        <span className="shrink-0 rounded bg-[#3FB68C]/15 px-1.5 py-0.5 font-mono text-[11px] text-[#3FB68C]">Active</span>
                      ) : null}
                      {proj.created_via === 'connector' ? (
                        <span className="shrink-0 rounded bg-[var(--border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">Connector</span>
                      ) : null}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {proj.widget_count != null ? `${proj.widget_count} widget${proj.widget_count === 1 ? '' : 's'}` : ''}
                      {proj.widget_count != null && createdLabel(proj.created_at) ? ' · ' : ''}
                      {createdLabel(proj.created_at) ? `created ${createdLabel(proj.created_at)}` : ''}
                    </span>
                  </button>
                  {!selecting ? (
                    <div className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => onRename(proj)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title="Rename"
                        aria-label={`Rename ${proj.name}`}
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(proj)}
                        disabled={atLimit || duplicatingId !== null}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--coral)] disabled:cursor-not-allowed disabled:opacity-40"
                        title={atLimit ? 'Project limit reached — free a slot to duplicate' : 'Duplicate'}
                        aria-label={`Duplicate ${proj.name}`}
                      >
                        {duplicatingId === proj.id ? <IconRefresh size={14} className="animate-spin" /> : <IconCopy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(proj)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)]"
                        title="Delete"
                        aria-label={`Delete ${proj.name}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          {selecting ? (
            confirmBulk ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  Permanently delete {selected.size} project{selected.size === 1 ? '' : 's'} and their canvases?
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirmBulk(false)} disabled={bulkBusy} className="cursor-pointer rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void runBulk()}
                    disabled={bulkBusy}
                    className="cursor-pointer rounded-xl bg-[var(--danger)] px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {bulkBusy ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(visible.map((p) => p.id)))}
                    className="cursor-pointer hover:text-[var(--text-primary)]"
                  >
                    Select all shown
                  </button>
                  <span>·</span>
                  <span>
                    {selected.size} selected{freeAfter != null && selected.size > 0 ? ` · ${freeAfter} slot${freeAfter === 1 ? '' : 's'} free after` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => setConfirmBulk(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--danger)] px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  <IconTrash size={14} />
                  Delete selected
                </button>
              </>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={onNew}
                disabled={atLimit}
                title={atLimit ? 'Project limit reached' : 'New project'}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--coral)] px-3 py-1.5 text-xs font-medium text-[var(--brand-ink)] hover:bg-[var(--coral-dark)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconPlus size={14} />
                New project
              </button>
              <button type="button" onClick={onClose} className="cursor-pointer px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
