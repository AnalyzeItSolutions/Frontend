'use client';

import { useEffect, useState } from 'react';
import { tool } from '../../lib/tools/tools.mjs';
import { CopyButton } from './CopyButton';

/** The interactive part of a /tools page. Runs the same function the page's examples and tests use; nothing leaves the browser. */
export function ToolRunner({ slug }: { slug: string }) {
  const t = tool(slug)!;
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(t.fields.map((f) => [f.key, f.default])));
  const [mode, setMode] = useState(t.modes?.[0].id);
  const [out, setOut] = useState<{ ok: boolean; text: string }>({ ok: true, text: '' });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(() => t.run(values, mode))
      .then((text) => live && setOut({ ok: true, text }), (e: Error) => live && setOut({ ok: false, text: e.message }));
    return () => { live = false; };
  }, [t, values, mode, nonce]);
  const input = 'mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';
  return (
    <form className="rounded-xl border border-[var(--border)] p-5 space-y-3" onSubmit={(e) => e.preventDefault()} aria-label={t.name}>
      {t.modes ? (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mode">
          {t.modes.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)}
              className={`rounded-full px-3 py-1 text-xs border ${mode === m.id ? 'bg-[var(--brand)] text-[var(--brand-ink)] border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className={t.fields.length > 1 && t.fields.every((f) => f.type === 'text') ? 'grid gap-3 sm:grid-cols-3' : 'space-y-3'}>
        {t.fields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="text-[var(--text-secondary)]">{f.label}</span>
            {f.type === 'textarea'
              ? <textarea rows={6} spellCheck={false} value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className={input} />
              : <input spellCheck={false} value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className={input} />}
          </label>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Result</span>
          <span className="flex gap-2">
            {slug === 'uuid-generator' ? <button type="button" onClick={() => setNonce((n) => n + 1)} className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-mono">New</button> : null}
            {out.ok && out.text ? <CopyButton text={out.text} /> : null}
          </span>
        </div>
        <pre aria-live="polite" className={`max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-[12.5px] ${out.ok ? 'border-[var(--border)] text-[var(--text-primary)]' : 'border-red-400/60 text-red-600 dark:text-red-400'}`}>{out.text || ' '}</pre>
      </div>
      <p className="text-xs text-[var(--text-muted)]">Runs entirely in your browser. Nothing you enter is sent or stored.</p>
    </form>
  );
}
