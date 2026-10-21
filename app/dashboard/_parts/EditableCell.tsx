'use client';

import { useState, type ReactNode } from 'react';
import { IconArrowDown, IconArrowUp, IconArrowsHorizontal, IconCopy, IconPencil, IconTrash } from '@tabler/icons-react';

const tool = 'grid h-7 w-7 place-items-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent';

/** Wraps one widget. In edit mode it gets a toolbar to move, resize, rename, duplicate and delete it. */
export function EditableCell({
  editing,
  title,
  isFirst,
  isLast,
  onMove,
  onToggleSpan,
  onDuplicate,
  onRename,
  onRemove,
  children,
}: {
  editing: boolean;
  title: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggleSpan: () => void;
  onDuplicate: () => void;
  onRename: (title: string) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  const [confirming, setConfirming] = useState(false);
  if (!editing) return <>{children}</>;

  const finishRename = () => {
    setRenaming(false);
    if (draft.trim() && draft.trim() !== title) onRename(draft);
  };

  return (
    <div className="group relative rounded-2xl pt-10 outline-dashed outline-1 outline-offset-2 outline-[var(--border-strong)] transition-[outline-color] hover:outline-[var(--coral)]">
      <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-md">
        {renaming ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={finishRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            aria-label="Widget title"
            className="h-7 w-40 rounded-md bg-[var(--surface-2)] px-2 text-xs outline-none focus:ring-1 focus:ring-[var(--coral)]"
          />
        ) : confirming ? (
          <>
            <span className="px-2 text-[11px] text-[var(--text-secondary)]">Delete “{title.slice(0, 24)}”?</span>
            <button type="button" className="rounded-md bg-[var(--danger)] px-2 py-1 text-[11px] font-medium text-white" onClick={onRemove}>Delete</button>
            <button type="button" className="px-2 py-1 text-[11px] text-[var(--text-muted)]" onClick={() => setConfirming(false)}>Cancel</button>
          </>
        ) : (
          <>
            <button type="button" className={tool} onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" title="Move up"><IconArrowUp size={14} /></button>
            <button type="button" className={tool} onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" title="Move down"><IconArrowDown size={14} /></button>
            <button type="button" className={tool} onClick={onToggleSpan} aria-label="Toggle width" title="Wide / narrow"><IconArrowsHorizontal size={14} /></button>
            <button type="button" className={tool} onClick={() => { setDraft(title); setRenaming(true); }} aria-label="Rename" title="Rename"><IconPencil size={14} /></button>
            <button type="button" className={tool} onClick={onDuplicate} aria-label="Duplicate" title="Duplicate"><IconCopy size={14} /></button>
            <button type="button" className={`${tool} hover:!text-[var(--danger)]`} onClick={() => setConfirming(true)} aria-label="Delete widget" title="Delete"><IconTrash size={14} /></button>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
