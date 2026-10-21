'use client';

import { useCallback, useRef, useState } from 'react';
import { getProjectLayout, updateProjectLayout, type WidgetSpec } from '../../lib/chatApi';
import { newWidgetId, reorder } from '../../lib/dashboardTools.mjs';

const UNDO_DEPTH = 20;

/**
 * Editing the dashboard's widgets: add, remove, move, duplicate, rename, resize and undo. Changes show at once
 * and are saved behind the scenes (one save at a time, always the latest layout); a failed save restores what
 * the server has instead of leaving the screen out of step with it.
 */
export function useLayoutEditor({
  projectId,
  widgets,
  version,
  setWidgets,
  setVersion,
  cap,
}: {
  projectId: string | null;
  widgets: WidgetSpec[];
  version: number;
  setWidgets: (next: WidgetSpec[]) => void;
  setVersion: (v: number) => void;
  cap: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoDepth, setUndoDepth] = useState(0);
  const widgetsRef = useRef(widgets);
  const versionRef = useRef(version);
  widgetsRef.current = widgets;
  versionRef.current = version;
  const undoStack = useRef<WidgetSpec[][]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const save = useCallback(() => {
    if (!projectId) return;
    queue.current = queue.current.then(async () => {
      setSaving(true);
      try {
        const res = await updateProjectLayout(projectId, versionRef.current, { widgets: widgetsRef.current }, 'user');
        if (res?.version) {
          versionRef.current = res.version;
          setVersion(res.version);
        }
        setError(null);
        setSavedAt(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save your changes.');
        try {
          const fresh = await getProjectLayout(projectId); // show what is really saved
          widgetsRef.current = fresh.layout_json.widgets || [];
          versionRef.current = fresh.version;
          setWidgets(widgetsRef.current);
          setVersion(fresh.version);
        } catch {
          /* keep the local view; the error above says it did not save */
        }
      } finally {
        setSaving(false);
      }
    });
  }, [projectId, setVersion, setWidgets]);

  const commit = useCallback(
    (next: WidgetSpec[]) => {
      undoStack.current = [...undoStack.current.slice(-(UNDO_DEPTH - 1)), widgetsRef.current];
      setUndoDepth(undoStack.current.length);
      widgetsRef.current = next;
      setWidgets(next);
      save();
    },
    [save, setWidgets],
  );

  const atCap = widgets.length >= cap;

  const add = useCallback(
    (spec: WidgetSpec) => {
      if (widgetsRef.current.length >= cap) {
        setError(`Your plan allows ${cap} widgets. Remove one or upgrade to add more.`);
        return false;
      }
      commit([...widgetsRef.current, spec]);
      return true;
    },
    [cap, commit],
  );

  const remove = useCallback((id: string) => commit(widgetsRef.current.filter((w) => w.id !== id)), [commit]);

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      const list = widgetsRef.current;
      const from = list.findIndex((w) => w.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return;
      commit(reorder(list, from, to) as WidgetSpec[]);
    },
    [commit],
  );

  const duplicate = useCallback(
    (id: string) => {
      const list = widgetsRef.current;
      const i = list.findIndex((w) => w.id === id);
      if (i < 0) return;
      if (list.length >= cap) return setError(`Your plan allows ${cap} widgets. Remove one or upgrade to add more.`);
      const src = list[i];
      const copy = { ...src, id: newWidgetId(), title: `${src.title || src.label || 'Widget'} (copy)` } as WidgetSpec;
      commit([...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
    },
    [cap, commit],
  );

  const rename = useCallback(
    (id: string, title: string) => {
      const clean = title.trim().slice(0, 80);
      if (!clean) return;
      commit(
        widgetsRef.current.map((w) =>
          w.id === id ? ({ ...w, title: clean, ...(w.props && 'title' in w.props ? { props: { ...w.props, title: clean } } : {}) } as WidgetSpec) : w,
        ),
      );
    },
    [commit],
  );

  const toggleSpan = useCallback(
    (id: string) =>
      commit(
        widgetsRef.current.map((w) => {
          if (w.id !== id) return w;
          const current = w.span || (w.type === 'line_chart' || w.type === 'table' ? 2 : 1);
          return { ...w, span: current === 2 ? 1 : 2 } as WidgetSpec;
        }),
      ),
    [commit],
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    setUndoDepth(undoStack.current.length);
    if (!previous) return;
    widgetsRef.current = previous;
    setWidgets(previous);
    save();
  }, [save, setWidgets]);

  /** Resolves once every pending save has finished (a new live widget can only refresh after it is saved). */
  const flush = useCallback(() => queue.current, []);

  return { flush, editing, setEditing, saving, savedAt, error, clearError: () => setError(null), canUndo: undoDepth > 0, atCap, add, remove, move, duplicate, rename, toggleSpan, undo };
}
