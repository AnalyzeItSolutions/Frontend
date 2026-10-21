'use client';

import { IconMapPin, IconX } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { GLOBE_HUBS } from '../../Components/globe/sourceCatalog';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { GeoSearchHit } from '../../lib/geoApi';
import { placeLabel, type ComparePlace } from './layers';
import { RankedBars } from './RankedBars';

const labelCls = 'mb-2 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]';

/** Under the layers: search results while typing, otherwise the strongest signals, hubs and the compare list. */
export function SidePanelBody({
  query,
  hits,
  searching,
  onPick,
  onHub,
  compare,
  onRemoveCompare,
  showCatalog,
}: {
  query: string;
  hits: GeoSearchHit[];
  searching: boolean;
  onPick: (hit: GeoSearchHit) => void;
  onHub: (hub: { name: string; lat: number; lon: number }) => void;
  compare: ComparePlace[];
  onRemoveCompare: (id: string) => void;
  showCatalog: boolean;
}) {
  const { archivePoints, overlayPoints, activeHub } = useGlobe();

  if (query.trim().length >= 2) {
    return (
      <div className="space-y-1">
        <p className={labelCls}>Results</p>
        {searching && hits.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--surface-2)]" />
            ))}
          </div>
        ) : null}
        <AnimatePresence initial={false}>
          {hits.map((hit, i) => (
            <motion.button
              key={`${hit.name}-${hit.lat}-${hit.lon}`}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.03, duration: 0.18 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              onClick={() => onPick(hit)}
              className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-[var(--surface-2)]"
            >
              <IconMapPin size={14} className="mt-0.5 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="block font-medium text-[var(--text-primary)]">{hit.name}</span>
                <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                  {hit.display_name || `${hit.region || ''}${hit.country ? ` · ${hit.country}` : ''}`}
                </span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
        {!searching && hits.length === 0 ? <p className="px-1 py-2 text-[11px] text-[var(--text-muted)]">No match — click the map instead.</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RankedBars points={showCatalog ? [...archivePoints, ...overlayPoints] : overlayPoints} />
      <div>
        <p className={labelCls}>Hubs</p>
        <div className="flex flex-wrap gap-1.5">
          {GLOBE_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => onHub(hub)}
              className={`min-h-8 whitespace-nowrap rounded-full px-3 text-xs transition-all active:scale-95 ${
                activeHub === hub.name
                  ? 'bg-brand font-semibold text-brand-ink'
                  : 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {hub.name}
            </button>
          ))}
        </div>
      </div>
      {compare.length > 0 ? (
        <div>
          <p className={labelCls}>Compare ({compare.length}/3)</p>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {compare.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-2 overflow-hidden rounded-xl border border-[var(--border)] px-2.5 py-2 text-xs"
                >
                  <span className="min-w-0 truncate font-medium text-[var(--text-primary)]">{placeLabel(p)}</span>
                  <button
                    type="button"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label={`Remove ${p.name || 'place'}`}
                    onClick={() => onRemoveCompare(p.id)}
                  >
                    <IconX size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">Search a place to begin — or jump a hub, then add up to three places to compare.</p>
      )}
    </div>
  );
}
