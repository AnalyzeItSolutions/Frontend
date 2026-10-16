'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { WidgetSpec } from '../../lib/chatApi';
import { deleteTemplate, listMyTemplates, saveTemplate, type UserTemplate } from '../../lib/userTemplatesApi';

type Props = {
  userId: string | undefined;
  canvasWidgets: WidgetSpec[];
  busy: boolean;
  onUse: (name: string, widgets: WidgetSpec[]) => void;
  onNotice: (message: string) => void;
};

/** Templates this person saved from their own canvases: save the current canvas, start a new project from one, delete one. */
export function MyTemplates({ userId, canvasWidgets, busy, onUse, onNotice }: Props) {
  const [items, setItems] = useState<UserTemplate[] | null>(null);
  const [name, setName] = useState('');
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setItems(await listMyTemplates(userId));
    } catch (err) {
      setItems([]);
      onNotice(err instanceof Error ? err.message : 'Could not load your templates');
    }
  }, [userId, onNotice]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || working || canvasWidgets.length === 0) return;
    setWorking(true);
    try {
      await saveTemplate(name.trim(), canvasWidgets);
      setName('');
      onNotice(`Saved “${name.trim()}” as a template`);
      await load();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Could not save the template');
    } finally {
      setWorking(false);
    }
  };

  const remove = async (t: UserTemplate) => {
    if (working || !window.confirm(`Delete the template “${t.name}”? Projects made from it are not affected.`)) return;
    setWorking(true);
    try {
      await deleteTemplate(t.id);
      setItems((prev) => (prev || []).filter((x) => x.id !== t.id));
      onNotice(`Deleted “${t.name}”`);
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Could not delete the template');
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="space-y-4 border-t border-[var(--border)] pt-6" aria-label="Your templates">
      <div>
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Your templates</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Save the layout of your current canvas to start future projects from it.</p>
      </div>
      <form onSubmit={save} className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder={canvasWidgets.length ? 'Name this layout' : 'Add widgets to a canvas first'}
          disabled={canvasWidgets.length === 0}
          aria-label="Template name"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50"
        />
        <button type="submit" disabled={!name.trim() || working || canvasWidgets.length === 0} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
          Save current canvas
        </button>
      </form>
      {items === null ? (
        <p className="text-xs text-[var(--text-muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">You have not saved a template yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((t) => (
            <li key={t.id} className="app-card p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] break-words">{t.name}</p>
                <p className="text-[11px] font-mono text-[var(--text-muted)]">
                  {t.widgets.length} widget{t.widgets.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy || working} onClick={() => onUse(t.name, t.widgets)} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
                  Use template
                </button>
                <button type="button" disabled={working} onClick={() => void remove(t)} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
