'use client';

import { useState } from 'react';

export interface ResearchSource {
  host: string;
  url?: string;
  title?: string;
  verified?: boolean;
  source_id?: string;
  category?: string;
  lat?: number;
  lng?: number;
  lon?: number;
  contribution?: number;
}

export const CATEGORY_COLOR: Record<string, string> = {
  geo_live: '#E4E4E2',
  stats: '#E4E4E2',
  archives: '#ca8a04',
  science: '#0d9488',
  maps: '#141414',
  culture: '#a855f7',
  media: '#db2777',
};

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    geo_live: 'live geo',
    stats: 'stats',
    archives: 'archives',
    science: 'science',
    maps: 'maps',
    culture: 'culture',
    media: 'media',
  };
  return labels[category] || category;
}

const VISIBLE = 4;

/** One chip per site (a page cited four times is one source), verified first, the rest behind "+N more". */
export function uniqueSources(sources: ResearchSource[]): ResearchSource[] {
  const byHost = new Map<string, ResearchSource>();
  for (const s of sources) {
    const key = (s.host || s.url || '').toLowerCase();
    const prev = byHost.get(key);
    if (!prev || (s.verified && !prev.verified)) byHost.set(key, s);
  }
  return [...byHost.values()].sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)));
}

export function SourceChips({ sources }: { sources: ResearchSource[] }) {
  const [open, setOpen] = useState(false);
  const list = uniqueSources(sources);
  if (!list.length) return null;
  const shown = open ? list : list.slice(0, VISIBLE);
  const hidden = list.length - shown.length;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1" aria-label="Sources">
      <span className="mr-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Sources</span>
      {shown.map((source) => (
        <a
          key={source.url || source.host}
          href={source.url || `https://${source.host}`}
          target="_blank"
          rel="noreferrer"
          title={source.verified ? 'Verified source' : 'Found while searching; not verified'}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-brand/40 hover:text-[var(--text-primary)]"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: source.verified ? CATEGORY_COLOR[source.category || ''] || '#3FB68C' : 'var(--border-strong)' }}
            aria-hidden
          />
          <span className="max-w-[10rem] truncate font-medium">{source.host.replace(/^www\./, '')}</span>
        </a>
      ))}
      {hidden > 0 || open ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {open ? 'Show less' : `+${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}
