'use client';

import type { SourcePoint } from '../globe/types';

export function AircraftIcon({ category, trackDeg }: { category?: string; trackDeg?: number }) {
  const cat = category || 'unknown';
  const rot = trackDeg != null && Number.isFinite(trackDeg) ? trackDeg : 0;
  // Simple top-down silhouettes by category
  if (cat === 'heli') {
    return (
      <svg className="globe-ac-icon globe-ac-icon--heli" viewBox="0 0 24 24" aria-hidden style={{ transform: `rotate(${rot}deg)` }}>
        <ellipse cx="12" cy="13" rx="3.2" ry="4.5" fill="currentColor" />
        <rect x="2" y="11.2" width="20" height="1.6" rx="0.8" fill="currentColor" opacity="0.9" />
        <rect x="11.2" y="17" width="1.6" height="4" rx="0.6" fill="currentColor" />
      </svg>
    );
  }
  if (cat === 'heavy' || cat === 'airliner') {
    return (
      <svg className={`globe-ac-icon globe-ac-icon--${cat}`} viewBox="0 0 24 24" aria-hidden style={{ transform: `rotate(${rot}deg)` }}>
        <path
          fill="currentColor"
          d="M12 2.5c.6 0 1.1.3 1.3.8l1.2 3.2 6.3 3.1c.7.3.7 1.3 0 1.6l-6.3 2.4-.4 5.4 2.4 1.6v1.4l-4.5-1.2L8 21.9v-1.4l2.4-1.6-.4-5.4-6.3-2.4c-.7-.3-.7-1.3 0-1.6l6.3-3.1L11 3.3c.2-.5.7-.8 1-.8z"
        />
      </svg>
    );
  }
  if (cat === 'jet') {
    return (
      <svg className="globe-ac-icon globe-ac-icon--jet" viewBox="0 0 24 24" aria-hidden style={{ transform: `rotate(${rot}deg)` }}>
        <path fill="currentColor" d="M12 3l2 6 7 2-7 2-2 8-2-8-7-2 7-2z" />
      </svg>
    );
  }
  // light / uav / unknown — compact plane
  return (
    <svg className={`globe-ac-icon globe-ac-icon--${cat}`} viewBox="0 0 24 24" aria-hidden style={{ transform: `rotate(${rot}deg)` }}>
      <path
        fill="currentColor"
        d="M12 3.2c.45 0 .8.25.95.65L14 7.5l5.8 2.2c.55.2.55.95 0 1.15L14 13l-.8 5.6 2 1.2v1.1L12 19.7 8.8 21v-1.1l2-1.2L10 13 4.2 10.85c-.55-.2-.55-.95 0-1.15L10 7.5l1.05-3.65c.15-.4.5-.65.95-.65z"
      />
    </svg>
  );
}

export function EventMarker({
  point,
  selected,
}: {
  point: SourcePoint;
  selected?: boolean;
}) {
  const host = point.host || 'event';
  const isFlight = host === 'flights';
  const isSat = host === 'iss';
  const isIssNow = isSat && (point.meta?.type === 'iss' || point.id.includes('iss-now'));
  return (
    <button
      type="button"
      title={point.label}
      aria-label={point.label}
      className={`globe-event-marker ${point.pulse ? 'globe-event-marker--pulse' : ''} ${
        selected ? 'globe-event-marker--selected' : ''
      } ${isFlight ? 'globe-event-marker--flight' : ''}`}
    >
      {isFlight ? (
        <span className={`globe-pin globe-pin--flight-icon globe-pin--${point.category || 'unknown'}`}>
          <AircraftIcon category={point.category} trackDeg={point.trackDeg} />
        </span>
      ) : (
        <span
          className={`globe-pin globe-pin--event globe-pin--${host} ${
            isSat && !isIssNow ? 'globe-pin--satellite' : ''
          } ${isIssNow ? 'globe-pin--iss-now' : ''}`}
        />
      )}
      {/* Labels only when selected — dense layers otherwise unreadably overlap. */}
      {(selected || point.showLabel === true) && !isFlight ? (
        <span className={`globe-event-label globe-event-label--${host}`}>{point.label}</span>
      ) : null}
      {isFlight && selected ? (
        <span className="globe-event-label globe-event-label--flights">{point.label}</span>
      ) : null}
    </button>
  );
}

export function SourcePin({
  point,
  selected,
}: {
  point: SourcePoint;
  selected?: boolean;
}) {
  if (point.kind === 'event') {
    return <EventMarker point={point} selected={selected} />;
  }
  const size =
    point.kind === 'live'
      ? 12
      : point.kind === 'place'
        ? 11
        : point.kind === 'hub'
          ? 9
          : point.tier === 'trusted'
            ? 7
            : 5.5;
  return (
    <button
      type="button"
      title={point.host ? `${point.label} · ${point.host}` : point.label}
      aria-label={point.label}
      className={`globe-pin globe-pin--${point.kind} ${point.pulse ? 'globe-pin--pulse' : ''} ${
        selected ? 'globe-pin--selected' : ''
      }`}
      style={{ width: size, height: size }}
    />
  );
}
