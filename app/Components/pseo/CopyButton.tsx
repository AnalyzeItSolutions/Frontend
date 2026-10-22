'use client';

import { useState } from 'react';

/** Copies a short text to the clipboard. Rendered as a plain button, so the text it copies is also in the page HTML. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }, () => {});
      }}
      className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-mono text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
    >
      {done ? 'Copied' : label}
    </button>
  );
}
