'use client';

import Link from 'next/link';
import { useState } from 'react';
import { uPlus, utf8 } from '../../lib/unicode/encode.mjs';

/** Paste text, see each character's code point and UTF-8 bytes, with a link to its page. Runs in the browser only. */
export function UnicodeLookup() {
  const [text, setText] = useState('é€😂क');
  const cps = [...text].slice(0, 200).map((ch) => ch.codePointAt(0)!);
  return (
    <div className="rounded-xl border border-[var(--border)] p-5 space-y-3">
      <label className="block text-sm">
        <span className="text-[var(--text-secondary)]">Paste or type characters</span>
        <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
      </label>
      <ul className="space-y-1 text-[13px]">
        {cps.map((cp, i) => (
          <li key={`${cp}-${i}`} className="font-mono">
            <span className="inline-block w-8 text-base">{String.fromCodePoint(cp)}</span>
            <Link href={`/unicode/${cp.toString(16).padStart(4, '0')}`} className="text-[var(--text-primary)] underline underline-offset-2">{uPlus(cp)}</Link>
            <span className="text-[var(--text-muted)]"> · UTF-8 {utf8(cp).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')} · &amp;#{cp};</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--text-muted)]">Nothing you type leaves your browser. Characters without a named page (private use, unassigned) lead to a not-found page.</p>
    </div>
  );
}
