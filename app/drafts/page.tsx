'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppShell } from '../Components/app/AppShell';
import { PageTitle } from '../Components/app/PageTitle';
import { createExtensionClient, type ExtensionState } from '../lib/extensionClient.mjs';
import {
  EXTENSION_STORE_URL,
  PLATFORMS,
  canApprove,
  charsLeft,
  extensionBlock,
  extensionLabel,
  fillMessage,
  isDirty,
  platform,
  statusLabel,
  type Draft,
} from '../lib/drafts.mjs';
import { addVoiceSamples, approveDraft, cancelDraft, composeLink, createDraft, forgetVoice, getVoice, listDrafts, markSent, saveDraft, type VoiceProfile } from '../lib/draftsApi';

type Client = ReturnType<typeof createExtensionClient>;

const OFFLINE: ExtensionState = { connected: false, version: null, platforms: {}, paused: false };
let shared: Client | null = null;
function getClient(): Client | null {
  if (typeof window === 'undefined') return null;
  return (shared ??= createExtensionClient(window));
}
const noop = () => () => {};
const serverClient = () => null;

const field = 'w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]';
const small = 'text-xs text-[var(--text-muted)]';

function ExtensionCard({ state }: { state: ExtensionState }) {
  const on = state.connected;
  return (
    <section className="app-card p-4" aria-label="Browser extension">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium ${on ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${on ? 'bg-[var(--success)]' : 'bg-[var(--text-disabled)]'}`} />
          {extensionLabel(state)}
        </span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Browser extension</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {on
          ? 'Approved drafts can be put into your post box in this browser. You check the text, press Fill, then press Post yourself. It works only while this browser is open.'
          : 'Optional. With the extension, an approved draft is put into your post box in this browser, in your own logged-in session. Without it you can open the compose page or copy the text.'}
      </p>
      {!on ? (
        <p className={`mt-2 ${small}`}>
          {EXTENSION_STORE_URL ? (
            <a className="underline" href={EXTENSION_STORE_URL} target="_blank" rel="noreferrer">Install the extension</a>
          ) : (
            'Not in the browser stores yet, so there is nothing to install for now. The compose-page and copy options below work without it.'
          )}
        </p>
      ) : null}
      <p className={`mt-2 ${small}`}>Nothing is ever posted for you and nothing is scheduled: there is no posting while your browser is closed. AnalyzeIt never sees your passwords.</p>
    </section>
  );
}

function DraftCard({ draft, ext, client, onChange, onGone }: { draft: Draft; ext: ExtensionState; client: Client; onChange: (d: Draft) => void; onGone: (id: string) => void }) {
  const [text, setText] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const p = platform(draft.platform);
  const value = text ?? draft.text;
  const editable = draft.status === 'draft' || draft.status === 'approved';
  const block = extensionBlock(ext, draft.platform);

  useEffect(() => {
    return client.onResult((r) => {
      if (r.draftId !== draft.id) return;
      setNote(fillMessage(r));
      setBusy('');
    });
  }, [client, draft.id]);

  async function run<T>(label: string, fn: () => Promise<T>, done?: (v: T) => void) {
    setBusy(label);
    setError('');
    setNote('');
    try {
      const v = await fn();
      done?.(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy((b) => (b === 'fill' ? b : ''));
    }
  }

  const save = () => run('save', () => saveDraft(draft.id, value), (d) => { setText(undefined); onChange(d); });
  const approve = () => run('approve', () => approveDraft(draft), (d) => onChange(d));
  const cancel = () => run('cancel', () => cancelDraft(draft.id), (d) => onChange(d));
  const sent = () => run('sent', () => markSent(draft.id), (d) => onChange(d));
  const openCompose = () => run('open', async () => {
    const { url } = await composeLink(draft.id);
    window.open(url, '_blank', 'noopener');
    return url;
  }, () => setNote('Opened the compose page with your text. Press Post there yourself, then mark it as posted here.'));
  const copyOpen = () => run('copy', async () => {
    await navigator.clipboard.writeText(draft.text);
    window.open(p?.site, '_blank', 'noopener');
  }, () => setNote('Text copied. Paste it into the site that just opened and press Post yourself.'));
  const fill = async () => {
    setBusy('fill');
    setError('');
    setNote('');
    const r = await client.fill({ draftId: draft.id, platform: draft.platform, text: draft.text, text_sha256: draft.text_sha256 });
    if (!r.ok) { setError(r.reason || 'The extension refused.'); setBusy(''); return; }
    setNote('A tab opened on the site. Press Fill on the banner there to put the text in the post box.');
    setBusy('');
  };

  return (
    <li className="app-card p-4" data-testid="draft-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-text)]">{p?.label ?? draft.platform}</span>
        <span className="text-xs font-medium text-[var(--text-secondary)]" data-testid="draft-status">{statusLabel(draft.status)}</span>
        <span className={`ml-auto ${small}`}>{draft.source === 'cli' ? 'from the CLI' : draft.source === 'chat' ? 'from chat' : ''}</span>
      </div>
      {editable ? (
        <>
          <textarea className={`${field} mt-3 min-h-28`} value={value} onChange={(e) => setText(e.target.value)} aria-label={`Draft for ${p?.label}`} />
          <div className="mt-1 flex items-center justify-between">
            <span className={`${small} ${charsLeft(draft.platform, value) < 0 ? '!text-[var(--danger)]' : ''}`}>{charsLeft(draft.platform, value)} characters left</span>
            {draft.status === 'approved' ? <span className={small}>Editing withdraws your approval.</span> : null}
          </div>
        </>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">{draft.text}</p>
      )}

      {editable ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {isDirty(draft, text) ? <button type="button" className="btn-secondary" disabled={!!busy || charsLeft(draft.platform, value) < 0} onClick={save}>{busy === 'save' ? 'Saving…' : 'Save changes'}</button> : null}
          {draft.status === 'draft' ? (
            <button type="button" className="btn-primary" disabled={!!busy || !canApprove(draft, value)} onClick={approve} title={isDirty(draft, text) ? 'Save your changes first' : undefined}>
              {busy === 'approve' ? 'Approving…' : 'Approve this exact text'}
            </button>
          ) : null}
          {draft.status === 'approved' && !isDirty(draft, text) ? (
            <>
              {ext.connected ? <button type="button" className="btn-primary" disabled={!!busy || !!block} onClick={fill} title={block ?? undefined}>{busy === 'fill' ? 'Sending…' : 'Fill it in my browser'}</button> : null}
              {p && p.id !== 'reddit' ? <button type="button" className="btn-secondary" disabled={!!busy} onClick={openCompose}>Open compose page</button> : null}
              <button type="button" className="btn-secondary" disabled={!!busy} onClick={copyOpen}>Copy text &amp; open site</button>
              <button type="button" className="btn-secondary" disabled={!!busy} onClick={sent}>I posted it</button>
            </>
          ) : null}
          <button type="button" className="btn-ghost" disabled={!!busy} onClick={cancel}>Cancel draft</button>
        </div>
      ) : (
        <div className="mt-3"><button type="button" className="btn-ghost" onClick={() => onGone(draft.id)}>Hide</button></div>
      )}
      {draft.status === 'approved' && ext.connected && block ? <p className={`mt-2 ${small}`}>Extension: {block}</p> : null}
      {note ? <p role="status" className="mt-2 text-sm text-[var(--text-secondary)]">{note}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </li>
  );
}

function VoiceCard() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(() => { getVoice().then(setProfile).catch(() => {}); }, []);
  useEffect(refresh, [refresh]);

  async function learn() {
    setError(''); setMsg('');
    const texts = paste.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((t) => t.trim()).filter((t) => t.length >= 20);
    if (!texts.length) { setError('Paste a few of your own past posts, separated by blank lines (each at least 20 characters).'); return; }
    try {
      const r = await addVoiceSamples(texts);
      setMsg(`Learned from ${r.stored} of your posts.`);
      setPaste('');
      refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); }
  }
  async function forget() {
    try { const r = await forgetVoice(); setMsg(`Forgot ${r.deleted} items.`); refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not forget.'); }
  }
  const s = profile?.sources;
  const total = s ? s.samples + s.finals + s.edits : 0;
  return (
    <section className="app-card p-4" aria-label="Your voice">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Your voice</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        Drafts are written to match how you write. It learns from posts you paste here, drafts you approve, and the changes you make to drafts. It only ever uses your own words, and it is for matching your style, not for getting past AI-text detectors.
      </p>
      {total > 0 && profile ? (
        <div className="mt-3 text-sm text-[var(--text-secondary)]">
          <p>{s?.samples} pasted · {s?.finals} approved · {s?.edits} edits{profile.stats.avg_words ? ` · about ${profile.stats.avg_words} words per post` : ''}</p>
          {profile.edit_lessons.length ? <ul className="mt-1 list-disc pl-5">{profile.edit_lessons.map((l) => <li key={l}>{l}</li>)}</ul> : null}
        </div>
      ) : <p className={`mt-3 ${small}`}>Nothing learned yet.</p>}
      <textarea className={`${field} mt-3 min-h-24`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste some of your past posts, one after another, with a blank line between them" aria-label="Past posts" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={learn} disabled={!paste.trim()}>Learn from these</button>
        {total > 0 ? <button type="button" className="btn-ghost" onClick={forget}>Forget my voice</button> : null}
      </div>
      {msg ? <p role="status" className="mt-2 text-sm text-[var(--text-secondary)]">{msg}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </section>
  );
}

export default function DraftsPage() {
  const client = useSyncExternalStore(noop, getClient, serverClient);
  const ext = useSyncExternalStore(
    (notify) => (client ? client.onChange(() => notify()) : () => {}),
    () => client?.state ?? OFFLINE,
    () => OFFLINE,
  );
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [newPlatform, setNewPlatform] = useState('x');
  const [newText, setNewText] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listDrafts()
      .then((d) => !cancelled && setDrafts(d))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : 'Could not load drafts.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  async function create() {
    setCreating(true);
    setCreateError('');
    try {
      const d = await createDraft(newPlatform, newText);
      setDrafts((all) => [d, ...all]);
      setNewText('');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Could not create the draft.');
    } finally {
      setCreating(false);
    }
  }

  const shown = useMemo(() => drafts.filter((d) => !hidden.includes(d.id)), [drafts, hidden]);
  const left = charsLeft(newPlatform, newText);

  return (
    <AppShell active="drafts">
      <PageTitle title="Drafts" />
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
        Write or edit a post, approve the exact text, then post it yourself. Nothing leaves AnalyzeIt until you approve it, and you always press Post.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="app-card p-4" aria-label="New draft">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">New draft</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Platform">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={newPlatform === p.id} onClick={() => setNewPlatform(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${newPlatform === p.id ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--accent-text)]' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <textarea className={`${field} mt-3 min-h-28`} value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="What do you want to say?" aria-label="Draft text" />
            <div className="mt-1 flex items-center justify-between">
              <span className={`${small} ${left < 0 ? '!text-[var(--danger)]' : ''}`}>{left} characters left</span>
              <button type="button" className="btn-primary" disabled={creating || !newText.trim() || left < 0} onClick={create}>{creating ? 'Saving…' : 'Save draft'}</button>
            </div>
            {createError ? <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{createError}</p> : null}
          </section>

          {loading ? <p className="text-sm text-[var(--text-muted)]">Loading drafts…</p> : null}
          {loadError ? <p role="alert" className="text-sm text-[var(--danger)]">{loadError}</p> : null}
          {!loading && !loadError && !shown.length ? <p className="text-sm text-[var(--text-muted)]">No drafts yet. Write one above, or ask in chat or the CLI to draft something in your voice.</p> : null}
          <ul className="flex flex-col gap-4">
            {client ? shown.map((d) => (
              <DraftCard key={d.id} draft={d} ext={ext} client={client} onChange={(n) => setDrafts((all) => all.map((x) => (x.id === n.id ? n : x)))} onGone={(id) => setHidden((h) => [...h, id])} />
            )) : null}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <ExtensionCard state={ext} />
          <VoiceCard />
        </div>
      </div>
    </AppShell>
  );
}
