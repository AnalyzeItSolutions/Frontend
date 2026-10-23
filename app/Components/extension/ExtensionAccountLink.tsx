'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredToken } from '../../lib/auth';
import { createExtensionClient, type ExtensionState } from '../../lib/extensionClient.mjs';
import { API_ORIGIN, linkBrowser, unlinkBrowser } from '../../lib/draftsApi';

type Client = ReturnType<typeof createExtensionClient>;

/** Lets assistants connected to this AnalyzeIt account online (Claude, ChatGPT) use this browser through the extension, under its rules. */
export function ExtensionAccountLink() {
  const [client, setClient] = useState<Client | null>(null);
  const [ext, setExt] = useState<ExtensionState | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
    const c = createExtensionClient(window);
    setClient(c);
    return c.onChange(setExt);
  }, []);

  async function link() {
    if (!client) return;
    setBusy(true); setMsg('');
    try {
      const l = await linkBrowser(navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser');
      const r = await client.linkAccount({ token: l.token, api: API_ORIGIN });
      if (!r.ok) { await unlinkBrowser(l.id).catch(() => {}); setMsg(r.reason || 'The extension did not accept the link.'); }
      else setMsg('Linked. Assistants connected to your account can now work in this browser.');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Something went wrong. Try again.'); }
    setBusy(false);
  }

  async function unlink() {
    if (!client) return;
    setBusy(true); setMsg('');
    const r = await client.unlinkAccount(); // the extension revokes its own link on AnalyzeIt; other linked browsers stay linked
    setMsg(r.ok ? 'Unlinked.' : r.reason || 'The extension did not answer.');
    setBusy(false);
  }

  const box = 'mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]';
  if (!signedIn) return <p className={box}><Link className="underline" href="/login?next=/extension">Sign in</Link> to let your assistants use this browser.</p>;
  if (!ext?.connected) return <p className={box}>Install the extension (above), then reload this page to link it.</p>;
  return (
    <div className={box} data-testid="extension-account-link">
      {ext.relay?.linked ? (
        <>
          <p><strong className="text-[var(--text-primary)]">This browser is linked to your account.</strong> Assistants you connected to AnalyzeIt online can open pages, read them and act step by step, with the same rules as everywhere else.</p>
          <button className="btn-secondary mt-3" disabled={busy} onClick={unlink}>Unlink this browser</button>
        </>
      ) : (
        <>
          <p>Let assistants you connected to AnalyzeIt online (Claude, ChatGPT) use this browser: they open a page, read it and act step by step. Only on sites you allow, never in password, code or card fields; signing in is yours, and posts, sends, buys and deletes ask you on the page first.</p>
          <button className="btn-primary mt-3" disabled={busy} onClick={link}>Let my assistants use this browser</button>
        </>
      )}
      {msg ? <p className="mt-2 text-xs" role="status">{msg}</p> : null}
    </div>
  );
}
