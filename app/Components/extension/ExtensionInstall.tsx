'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { BROWSER_IDS, STORES_CONFIG, chooseBrowser, installSteps, resolveBrowser, savePreference } from '../../lib/extensionStores.mjs';

const EVENT = 'analyzeit-ext-browser';

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener(EVENT, cb); };
}
function snapshot(): string | null {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* blocked */ }
  return chooseBrowser(storage, navigator.userAgent, Boolean((navigator as unknown as { brave?: unknown }).brave));
}
const server = () => null;

/** The browser the person uses (detected, and changeable), its store page, and the interim install while there is no listing. */
export function ExtensionInstall({ compact = false }: { compact?: boolean }) {
  const id = useSyncExternalStore(subscribe, snapshot, server);
  const b = id ? resolveBrowser(id) : null;

  function choose(next: string) {
    try { savePreference(window.localStorage, next); } catch { /* not remembered */ }
    window.dispatchEvent(new Event(EVENT));
  }

  const picker = (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      Your browser
      <select
        className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-1 text-sm text-[var(--text-primary)]"
        value={id ?? ''}
        onChange={(e) => choose(e.target.value)}
        aria-label="Browser to install the extension for"
      >
        {!id ? <option value="">Choose…</option> : null}
        {BROWSER_IDS.map((k) => <option key={k} value={k}>{STORES_CONFIG.browsers[k].label}</option>)}
      </select>
    </label>
  );

  if (!b) {
    return <div className="mt-2">{picker}<p className="mt-2 text-xs text-[var(--text-muted)]">Pick your browser to see how to get the extension. Phones and tablets can’t use it.</p></div>;
  }
  return (
    <div className="mt-2" data-testid="extension-install">
      {picker}
      {b.listed ? (
        <p className="mt-2 text-sm">
          <a className="btn-primary inline-flex" href={b.url ?? undefined} target="_blank" rel="noreferrer">Add to {b.label} ({b.store})</a>
        </p>
      ) : (
        <div className="mt-2 text-sm text-[var(--text-secondary)]">
          <p><strong className="text-[var(--text-primary)]">Not yet listed in the {b.store}.</strong> Until it is, you can install it yourself:</p>
          {compact ? (
            <p className="mt-1"><Link className="underline" href="/extension">See the steps for {b.label}</Link></p>
          ) : (
            <>
              <ol className="mt-2 list-decimal space-y-1 pl-5">{installSteps(b.packageKind, b.label).map((s) => <li key={s}>{s}</li>)}</ol>
              {b.packageFile ? (
                <p className="mt-3">
                  <a className="btn-secondary inline-flex" href={`/extension/${b.packageFile}`} download>Download {b.packageFile}</a>
                </p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
