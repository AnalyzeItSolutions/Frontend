'use client';

import { GlobeCanvas } from './GlobeCanvas';
import { useGlobe } from './useGlobe';

function useGlobeStatus() {
  const { flyCallout, inFlight, activePoints, expandToFull, selectedPoint } = useGlobe();
  const status =
    flyCallout ||
    (inFlight
      ? 'Flying…'
      : selectedPoint?.host ||
        selectedPoint?.label ||
        (activePoints.length
          ? `${activePoints.length} source${activePoints.length === 1 ? '' : 's'}`
          : null));
  return { status, inFlight, expandToFull };
}

/** The globe's status pill and expand button, for a toolbar row, so they never sit on top of the conversation. */
export function GlobeToolbarControls() {
  const { status, inFlight, expandToFull } = useGlobeStatus();
  return (
    <>
      {status ? (
        <span
          className={`hidden max-w-[10rem] truncate rounded-full px-2.5 py-1 font-mono text-[11px] tracking-wide sm:inline-block ${
            inFlight ? 'bg-brand/90 text-brand-ink' : 'border border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          {status}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => expandToFull()}
        className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
        aria-label="Open full globe"
        title="Open full globe"
      >
        <span className="hidden sm:inline">Expand globe</span>
        <span className="sm:hidden">Globe</span>
      </button>
    </>
  );
}

/** Full-bleed Chat globe — visual layer only; never calls POST /v1/geo/context. */
export function ChatMiniGlobe({ controls = true }: { controls?: boolean } = {}) {
  const { mapReady, activePoints, overlayPoints, inFlight: flying } = useGlobe();
  const { status, inFlight, expandToFull } = useGlobeStatus();
  // The globe only earns its place when a question is about somewhere. It stays mounted (so the map engine is
  // warm and the first fly-to is instant) but fades away until a place or a live layer is on it.
  const needed = activePoints.length > 0 || overlayPoints.length > 0 || flying;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-700 ease-out ${needed ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!needed}
    >
      <GlobeCanvas variant="mini" className="h-full w-full" />
      <div className="chat-globe-scrim absolute inset-0" />
      {!mapReady ? (
        <span className="absolute inset-0 z-10 flex items-center justify-center font-mono text-[11px] text-[var(--text-muted)]">
          Globe…
        </span>
      ) : null}

      {controls ? (
      <div className="pointer-events-auto absolute right-4 top-3 z-20 flex max-w-[min(16rem,42vw)] flex-col items-end gap-2 sm:right-6 sm:top-4">
        {status ? (
          <span
            className={`truncate rounded-full px-2.5 py-1 text-[11px] font-mono tracking-wide shadow-sm backdrop-blur-md ${
              inFlight
                ? 'bg-brand/90 text-brand-ink'
                : 'bg-[var(--surface)]/80 text-[var(--text-secondary)]'
            }`}
          >
            {status}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => expandToFull()}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] shadow-sm backdrop-blur-md hover:text-[var(--text-primary)]"
          aria-label="Open full globe"
        >
          Expand globe
        </button>
      </div>
      ) : null}
    </div>
  );
}
