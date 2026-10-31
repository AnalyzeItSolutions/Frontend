'use client';

import { useMemo, useState } from 'react';
import { IconLayersSubtract, IconLoader2, IconSearch } from '@tabler/icons-react';
import { layerHealthView } from '../../Components/globe/globeVisual.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import { LAYER_GROUPS } from '../../Components/globe/layerCatalog.mjs';
import { LAYERS, isRasterLayer, type LayerHealth, type LayerId } from './layers';

export function LayerHealthBadge({ count, health }: { count: number; health?: LayerHealth }) {
  const view = layerHealthView(count, health) as { label: string; tone: string };
  return <span className={`globe-health globe-health--${view.tone}`}>{view.label}</span>;
}

/** What a layer's badge should say: rasters and the catalog are always "ok", live layers report their fetch. */
export function layerStatus(
  id: LayerId,
  layerHealth: Partial<Record<LayerId, LayerHealth>>,
  loading: boolean,
): LayerHealth | undefined {
  if (id === 'catalog' || isRasterLayer(id)) return { status: 'ok' };
  return layerHealth[id] || (loading ? { status: 'loading' } : undefined);
}

export function LayerList({
  layers,
  onToggle,
  layerCounts,
  layerHealth,
  replayCounts,
  loading,
}: {
  layers: Record<LayerId, boolean>;
  onToggle: (id: LayerId) => void;
  layerCounts: Partial<Record<LayerId, number>>;
  layerHealth: Partial<Record<LayerId, LayerHealth>>;
  replayCounts: Record<string, number> | null;
  loading: boolean;
}) {
  const { archivePoints } = useGlobe();
  const [filter, setFilter] = useState('');
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return LAYERS;
    return LAYERS.filter((l) => l.label.toLowerCase().includes(q) || l.hint.toLowerCase().includes(q) || l.id.includes(q));
  }, [filter]);

  return (
    <div className="border-b border-[var(--border)] px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)]">
          <IconLayersSubtract size={13} aria-hidden />
          Layers
        </p>
        {loading ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
            <IconLoader2 size={12} className="animate-spin" aria-hidden />
            Updating
          </span>
        ) : null}
      </div>
      <label className="relative block">
        <IconSearch size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter layers…"
          aria-label="Filter layers"
          className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] pl-8 pr-3 text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--border-strong)]"
        />
      </label>
      <div className="globe-layer-scroll mt-1.5" role="group" aria-label="Map layers">
        {(filter.trim() ? [{ id: 'all', label: '' }] : LAYER_GROUPS).map((group) => {
          const rows = visible.filter((l) => group.id === 'all' || l.group === group.id);
          if (!rows.length) return null;
          return (
            <div key={group.id} className="globe-layer-group">
              {group.label ? <p className="globe-layer-group-title">{group.label}</p> : null}
              {rows.map((layer) => {
          const on = layers[layer.id];
          const count = isRasterLayer(layer.id)
            ? 1
            : layer.id === 'catalog'
              ? archivePoints.length
              : replayCounts
                ? (replayCounts[layer.id] ?? layerCounts[layer.id] ?? 0)
                : (layerCounts[layer.id] ?? 0);
          const message = layer.id === 'catalog' || isRasterLayer(layer.id) ? null : layerHealth[layer.id]?.message;
          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={on}
              title={message ? `${layer.hint} — ${message}` : layer.hint}
              onClick={() => onToggle(layer.id)}
              className={`globe-layer-toggle${on ? ' is-on' : ''}`}
            >
              <span className="globe-layer-swatch" style={{ background: layer.color }} aria-hidden />
              <span className="globe-layer-name">{layer.label}</span>
              {layer.coverage !== 'complete' ? <span className="globe-layer-coverage">{layer.coverage}</span> : null}
              {on ? <LayerHealthBadge count={count} health={layerStatus(layer.id, layerHealth, loading)} /> : null}
            </button>
          );
              })}
            </div>
          );
        })}
      </div>
      {filter.trim() && visible.length === 0 ? <p className="px-1 pt-2 text-[12px] text-[var(--text-secondary)]">No layers match that filter.</p> : null}
    </div>
  );
}
