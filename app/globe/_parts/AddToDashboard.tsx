'use client';

import { useState } from 'react';
import { IconLayoutDashboard } from '@tabler/icons-react';
import Link from 'next/link';
import { globeWidgetSpec } from '../../Components/globe/globeWidget.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import { getProjectLayout, updateProjectLayout, type WidgetSpec } from '../../lib/chatApi';
import { newWidgetId } from '../../lib/dashboardTools.mjs';

const MAX_WIDGETS = 30;

/** Put this view of the globe (its live layers, where it looks, the area drawn) on the project's dashboard as a live widget. */
export function AddToDashboard({
  project,
  layers,
  outline,
}: {
  project: { id: string; name: string } | null;
  layers: string[];
  outline: Array<[number, number]> | null;
}) {
  const { getView } = useGlobe();
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [note, setNote] = useState<string | null>(null);

  const add = async () => {
    if (!project) return;
    setState('saving');
    setNote(null);
    try {
      const widget = globeWidgetSpec({ id: newWidgetId('globe'), layers, view: getView(), outline }) as unknown as WidgetSpec;
      const layout = await getProjectLayout(project.id);
      const existing = layout.layout_json.widgets || [];
      if (existing.length >= MAX_WIDGETS) throw new Error(`That dashboard is full (${MAX_WIDGETS} widgets). Remove one first.`);
      await updateProjectLayout(project.id, layout.version, { widgets: [...existing, widget] }, 'user');
      setState('done');
    } catch (err) {
      setState('idle');
      setNote(err instanceof Error ? err.message : 'Could not add it to the dashboard');
    }
  };

  return (
    <div className="border-b border-[var(--border)] px-3 py-2">
      {state === 'done' && project ? (
        <p className="text-[11px] text-[var(--text-secondary)]" role="status">
          Added to {project.name}.{' '}
          <Link href={`/dashboard?project=${project.id}`} className="text-[var(--text-primary)] underline">
            Open the dashboard
          </Link>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void add()}
          disabled={!project || state === 'saving'}
          title={project ? `A live globe widget on ${project.name}'s dashboard` : 'Create a project first'}
          className="btn-secondary inline-flex min-h-8 w-full items-center justify-center gap-1.5 text-xs disabled:opacity-50"
        >
          <IconLayoutDashboard size={13} aria-hidden />
          {state === 'saving' ? 'Adding…' : 'Add this view to a dashboard'}
        </button>
      )}
      {note ? <p className="mt-1 text-[11px] text-[var(--text-secondary)]" role="alert">{note}</p> : null}
    </div>
  );
}
