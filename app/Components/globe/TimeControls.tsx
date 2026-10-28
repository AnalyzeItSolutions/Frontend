'use client';

import {
  IconBolt,
  IconCheck,
  IconLink,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconRepeat,
} from '@tabler/icons-react';
import { DAY_OPTIONS, cursorTime, formatCursor, windowBounds } from './scene.mjs';
import { TRAILS, trailsFor, type activityBuckets } from './timeline.mjs';
import { TimelineChart } from './TimelineChart';

type Activity = ReturnType<typeof activityBuckets>;

interface Props {
  days: number;
  onDays: (d: number) => void;
  /** 0..1 position of the playhead inside the window; 1 = live (now). */
  cursor: number;
  playing: boolean;
  onPlay: (on: boolean) => void;
  onScrub: (fraction: number) => void;
  onStep: (direction: number, slices?: number) => void;
  speed: number;
  onSpeed: () => void;
  /** Replay starts over at the beginning instead of stopping at "now". */
  loop: boolean;
  onLoop: (on: boolean) => void;
  /** Layers whose source hit its row cap: the start of the window is missing for them. */
  capped: string[];
  trail: string;
  onTrail: (id: string) => void;
  activity: Activity;
  layerColors: Record<string, string>;
  /** Events shown at the playhead / events in the window. */
  shown: number;
  total: number;
  /** Jump to the strongest event in the window; null when there is none to jump to. */
  onPeak: (() => void) | null;
  shared: boolean;
  onShare: () => void;
}

const chip = 'rounded-md border px-1.5 py-1 text-[11px] transition-colors';
const on = 'border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-primary)]';
const off = 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]';
const iconBtn =
  'grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] active:scale-95 disabled:opacity-40';

/** Time window, event-activity timeline with replay, trail, speed and "jump to the biggest" for the live layers. */
export function TimeControls(p: Props) {
  const live = p.cursor >= 1;
  const bounds = windowBounds(p.days);
  const when = formatCursor(cursorTime(p.cursor, bounds), p.days);
  const trailLabel = TRAILS.find((t) => t.id === p.trail)?.label;
  const summary = live
    ? p.trail === 'all'
      ? `Live · ${p.total} event${p.total === 1 ? '' : 's'} in the window`
      : `Live · last ${trailLabel} · ${p.shown} of ${p.total}`
    : `${when} · ${p.shown} of ${p.total} shown${p.trail === 'all' ? '' : ` (${trailLabel} trail)`}`;

  return (
    <div className="border-b border-[var(--border)] px-3 py-2" role="group" aria-label="Time window and replay">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-[var(--text-primary)]">Time</p>
        <button type="button" onClick={p.onShare} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]" title="Copy a link to this exact view, playhead included">
          {p.shared ? <IconCheck size={12} aria-hidden /> : <IconLink size={12} aria-hidden />}
          {p.shared ? 'Link copied' : 'Share view'}
        </button>
      </div>

      <div className="flex gap-1" role="radiogroup" aria-label="Event window">
        {DAY_OPTIONS.map((d) => (
          <button key={d} type="button" role="radio" aria-checked={p.days === d} onClick={() => p.onDays(d)} className={`flex-1 ${chip} ${p.days === d ? on : off}`}>
            {d === 1 ? '24h' : `${d}d`}
          </button>
        ))}
      </div>

      <div className="mt-2">
        <TimelineChart
          activity={p.activity}
          colors={p.layerColors}
          cursor={p.cursor}
          days={p.days}
          onScrub={p.onScrub}
          onStep={p.onStep}
          onToggle={() => p.onPlay(!p.playing)}
        />
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <button type="button" className={iconBtn} aria-label="Step back" title="Step back (←)" onClick={() => p.onStep(-1)}>
          <IconPlayerSkipBack size={13} aria-hidden />
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label={p.playing ? 'Pause replay' : 'Replay events over time'}
          title="Play / pause (Space)"
          onClick={() => {
            if (!p.playing && p.cursor >= 1) p.onScrub(0); // restart from the beginning
            p.onPlay(!p.playing);
          }}
        >
          {p.playing ? <IconPlayerPause size={14} aria-hidden /> : <IconPlayerPlay size={14} aria-hidden />}
        </button>
        <button type="button" className={iconBtn} aria-label="Step forward" title="Step forward (→)" onClick={() => p.onStep(1)} disabled={live}>
          <IconPlayerSkipForward size={13} aria-hidden />
        </button>
        <button type="button" className={`${chip} ${off} font-mono`} onClick={p.onSpeed} title="Playback speed" aria-label={`Playback speed ${p.speed}x`}>
          {p.speed}×
        </button>
        <button
          type="button"
          className={`${iconBtn} ${p.loop ? 'border-[var(--border-strong)] bg-[var(--surface-2)]' : ''}`}
          aria-label="Loop replay"
          aria-pressed={p.loop}
          title="Loop: start over when the replay reaches now"
          onClick={() => p.onLoop(!p.loop)}
        >
          <IconRepeat size={13} aria-hidden />
        </button>
        <button type="button" className={`${chip} ${off} ml-auto inline-flex items-center gap-1`} onClick={p.onPeak ?? undefined} disabled={!p.onPeak} title="Jump to the strongest event in this window">
          <IconBolt size={12} aria-hidden />
          Peak
        </button>
        <button type="button" onClick={() => p.onScrub(1)} disabled={live} className={`${chip} ${off} disabled:opacity-40`}>
          Live
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-1" role="radiogroup" aria-label="Trail length">
        <span className="mr-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]" title="Only show events this recent before the playhead">Trail</span>
        {trailsFor(p.days).map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={p.trail === t.id} onClick={() => p.onTrail(t.id)} className={`${chip} ${p.trail === t.id ? on : off}`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-1 text-[11px] text-[var(--text-muted)]" aria-live="polite">
        {summary}
      </p>
      {p.capped.length ? (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {p.capped.join(', ')}: more events than the feed returns at once; the start of this window is incomplete.
          A shorter window shows all of them.
        </p>
      ) : null}
    </div>
  );
}
