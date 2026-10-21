'use client';

import { IconArrowBackUp, IconBell, IconCheck, IconLoader2, IconPencil, IconPlus, IconRefresh, IconWorld } from '@tabler/icons-react';

/** The bar above the canvas: switch edit mode on, then add a widget, undo, and see that it saved. */
export function EditBar({
  editing,
  onToggle,
  onAdd,
  onUndo,
  canUndo,
  count,
  cap,
  saving,
  saved,
  error,
  onDismissError,
  onTrackCountry,
  onAlerts,
  onRefreshData,
  refreshing,
}: {
  editing: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onUndo: () => void;
  canUndo: boolean;
  count: number;
  cap: number;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onDismissError: () => void;
  onTrackCountry: () => void;
  onAlerts: () => void;
  onRefreshData: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          editing ? 'bg-brand text-brand-ink' : 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
        }`}
        aria-pressed={editing}
      >
        {editing ? <IconCheck size={14} /> : <IconPencil size={14} />}
        {editing ? 'Done' : 'Edit dashboard'}
      </button>
      {editing ? (
        <>
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
            <IconPlus size={14} /> Add widget
          </button>
          <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-40">
            <IconArrowBackUp size={14} /> Undo
          </button>
          <span className="font-mono text-[11px] text-[var(--text-muted)]" title="Widgets on this dashboard / your plan's limit">
            {count} / {cap}
          </span>
        </>
      ) : (
        <span className="text-[11px] text-[var(--text-muted)]">Add, arrange, rename and remove widgets.</span>
      )}
      <span className="ml-auto" />
      <button type="button" onClick={onTrackCountry} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]" title="Build a whole dashboard for a country from open data">
        <IconWorld size={14} /> Track a country
      </button>
      <button type="button" onClick={onAlerts} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
        <IconBell size={14} /> Alerts
      </button>
      <button type="button" onClick={onRefreshData} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50" title="Re-read live data now (it also refreshes by itself)">
        {refreshing ? <IconLoader2 size={14} className="animate-spin" /> : <IconRefresh size={14} />} Refresh
      </button>
      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]" role="status" aria-live="polite">
        {saving ? (
          <>
            <IconLoader2 size={12} className="animate-spin" /> Saving…
          </>
        ) : saved ? (
          <>
            <IconCheck size={12} /> Saved
          </>
        ) : null}
      </span>
      {error ? (
        <p role="alert" className="flex w-full items-center justify-between gap-2 rounded-lg bg-[var(--danger)]/10 px-2.5 py-1.5 text-[11px] text-[var(--danger)]">
          {error}
          <button type="button" onClick={onDismissError} className="underline">Dismiss</button>
        </p>
      ) : null}
    </div>
  );
}
