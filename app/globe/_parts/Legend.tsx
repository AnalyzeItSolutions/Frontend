'use client';

import { AnimatePresence, motion } from 'motion/react';
import { aqiColor, temperatureColor } from '../../Components/globe/pinColors.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import { LayerHealthBadge, layerStatus } from './LayerList';
import { LAYERS, isRasterLayer, type LayerHealth, type LayerId } from './layers';

/** Bottom-left key over the map: one row per layer that is on, plus the temperature / AQI scales. */
export function Legend({
  layers,
  layerCounts,
  layerHealth,
  loading,
}: {
  layers: Record<LayerId, boolean>;
  layerCounts: Partial<Record<LayerId, number>>;
  layerHealth: Partial<Record<LayerId, LayerHealth>>;
  loading: boolean;
}) {
  const { archivePoints } = useGlobe();
  const active = LAYERS.filter((l) => layers[l.id]);
  if (active.length === 0) return null;

  return (
    <motion.div
      className="globe-legend absolute bottom-3 left-3 z-20"
      aria-label="Layer legend"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <p className="globe-legend-kicker">Legend</p>
      <ul>
        <AnimatePresence initial={false}>
          {active.map((l) => {
            const count = isRasterLayer(l.id) ? 1 : l.id === 'catalog' ? archivePoints.length : (layerCounts[l.id] ?? 0);
            return (
              <motion.li key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <span className="globe-layer-swatch" style={{ background: l.color }} aria-hidden />
                <span className="globe-legend-name">{l.label}</span>
                {l.coverage !== 'complete' ? <span className="globe-legend-coverage">{l.coverage}</span> : <span />}
                <LayerHealthBadge count={count} health={layerStatus(l.id, layerHealth, loading)} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {layers.weather ? (
        <div className="mt-2">
          <div
            className="h-1.5 w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${[-30, -10, 0, 10, 20, 30, 40].map((t) => temperatureColor(t)).join(', ')})` }}
            aria-hidden
          />
          <div className="mt-0.5 flex justify-between font-mono text-[9px] text-[var(--text-muted)]">
            <span>−30°C</span>
            <span>10°</span>
            <span>40°C</span>
          </div>
        </div>
      ) : null}
      {layers.air_quality ? (
        <div className="mt-2 flex gap-1" aria-label="Air quality bands">
          {[25, 75, 125, 175, 250, 350].map((v) => (
            <span key={v} className="h-1.5 flex-1 rounded-full" style={{ background: aqiColor(v) || undefined }} aria-hidden />
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
