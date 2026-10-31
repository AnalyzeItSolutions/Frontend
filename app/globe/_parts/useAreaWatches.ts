'use client';

import { useCallback, useEffect, useState } from 'react';
import { addAreaWatch, deleteAreaWatch, listAreaWatches, type AreaWatch, type WatchLayer } from '../../lib/areaWatchApi';
import { getProjects } from '../../lib/chatApi';
import { pickScopedProject } from '../../lib/projectHome.mjs';

/**
 * The project's watched areas. A watch belongs to a project like its other alerts (the one in ?project=, else the person's first),
 * so its alerts arrive through that project's alert settings and show in its alert list.
 */
export function useAreaWatches(requestedProject: string) {
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [watches, setWatches] = useState<AreaWatch[]>([]);
  const [layers, setLayers] = useState<WatchLayer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (projectId: string) => {
    try {
      const out = await listAreaWatches(projectId);
      setWatches(out.watches);
      setLayers(out.layers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load watched areas');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((rows) => {
        if (cancelled) return;
        const picked = pickScopedProject(rows, requestedProject);
        const row = rows.find((r) => r.id === picked.projectId);
        if (!picked.projectId || !row) return;
        setProject({ id: row.id, name: row.name || 'your project' });
        void reload(row.id);
      })
      .catch(() => undefined); // signed out or offline: the panel just offers nothing to watch
    return () => {
      cancelled = true;
    };
  }, [requestedProject, reload]);

  const add = useCallback(
    async (body: Parameters<typeof addAreaWatch>[1]) => {
      if (!project) throw new Error('Create a project first: watched areas belong to a project, like its other alerts.');
      const w = await addAreaWatch(project.id, body);
      await reload(project.id);
      return w;
    },
    [project, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!project) return;
      await deleteAreaWatch(project.id, id);
      await reload(project.id);
    },
    [project, reload],
  );

  return { project, watches, layers, error, add, remove };
}
