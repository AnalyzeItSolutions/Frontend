'use client';

import { useRouter } from 'next/navigation';
import { IconWorld } from '@tabler/icons-react';
import { inferGlobeLayers } from './chatLayers.mjs';
import { globeLinkForPlaces } from './scene.mjs';

type Place = { name: string; lat: number; lon: number };

/** "Open on the globe" under an answer: the places it is about and the live layers the question was about. */
export function OpenOnGlobe({ places, question }: { places?: Place[]; question: string }) {
  const router = useRouter();
  const list = places ?? [];
  const layers = inferGlobeLayers(question, 3);
  if (!list.length && !layers.length) return null;

  const label = list.length === 1 ? list[0].name : list.length > 1 ? `${list.length} places` : layers.map((l) => l.replace('_', ' ')).join(' & ');
  return (
    <button
      type="button"
      onClick={() => router.push(globeLinkForPlaces(list, layers.length ? layers : undefined))}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
    >
      <IconWorld size={13} aria-hidden />
      Open {label} on the globe
    </button>
  );
}
