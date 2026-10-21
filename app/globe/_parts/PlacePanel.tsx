'use client';

import { IconMapPin } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { EventDetailCard } from '../../Components/map/EventDetailCard';
import { PlaceContextCard } from '../../Components/map/PlaceContextCard';
import type { PlaceContext } from '../../lib/geoApi';
import type { SourcePoint } from '../../Components/globe/types';
import { kpis, placeId, placeLabel, type ComparePlace, type Selected } from './layers';

const slide = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.1 } },
};

/** The right rail: the selected place (or event) with compare and "ask" actions. Swaps with a short slide. */
export function PlacePanel({
  selected,
  selectedEvent,
  context,
  loading,
  error,
  compare,
  inCompare,
  onRetry,
  onClose,
  onCloseEvent,
  onToggleCompare,
  onAsk,
  onAskCompare,
}: {
  selected: Selected | null;
  selectedEvent: SourcePoint | null;
  context: PlaceContext | null;
  loading: boolean;
  error: string | null;
  compare: ComparePlace[];
  inCompare: boolean;
  onRetry?: () => void;
  onClose: () => void;
  onCloseEvent: () => void;
  onToggleCompare: () => void;
  onAsk: () => void;
  onAskCompare: () => void;
}) {
  const empty = !selected && !selectedEvent && !loading && !error;
  const key = selectedEvent ? `event:${selectedEvent.id}` : selected ? `place:${placeId(selected)}` : 'none';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {empty ? (
          <motion.div key="none" {...slide} className="flex flex-1 flex-col items-start justify-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/12 text-brand">
              <IconMapPin size={22} />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[var(--text-primary)]">No place selected</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">Pick a search result, hub, map point, flight, or satellite. Details land here.</p>
            </div>
          </motion.div>
        ) : selectedEvent ? (
          <motion.div key={key} {...slide} className="min-h-0 flex-1 overflow-y-auto">
            <EventDetailCard point={selectedEvent} onClose={onCloseEvent} />
          </motion.div>
        ) : (
          <motion.div key={key} {...slide} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* The footer below owns "Ask about this place", so the card does not repeat it. */}
              <PlaceContextCard context={context} loading={loading} error={error} rail onRetry={onRetry} onClose={onClose} />
            </div>
            <div className="space-y-2 border-t border-[var(--border)] p-3">
              {compare.length >= 2 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                  <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Compare KPIs</p>
                  <div className="grid gap-2">
                    {compare.map((p) => (
                      <div key={p.id} className="rounded-lg bg-[var(--surface)] px-2 py-1.5">
                        <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">{placeLabel(p)}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {kpis(p.context).map((k) => (
                            <span key={k.label} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                              {k.label} {k.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={onAskCompare} className="btn-secondary mt-2 min-h-8 w-full text-xs">
                    Ask Research to compare
                  </button>
                </div>
              ) : null}
              <button type="button" disabled={!selected} onClick={onToggleCompare} className="btn-secondary min-h-8 w-full text-xs disabled:opacity-50">
                {inCompare ? 'Remove from compare' : 'Add to compare'}
              </button>
              <button
                type="button"
                disabled={!selected && !context}
                onClick={onAsk}
                className="btn-primary flex min-h-10 w-full items-center justify-center gap-1.5 text-sm disabled:opacity-50"
              >
                Ask about this place
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
