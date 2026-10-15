'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuthSession, fetchMe, getStoredToken, type UserProfile } from '../../lib/auth';
import { consentPath, isSafeRedirect, parseRequestId } from '../../lib/oauthConsent.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Stage = 'checking' | 'invalid' | 'confirm' | 'working' | 'sent' | 'cancelled' | 'error';
type Scope = { id: string; description: string; required?: boolean; default?: boolean };
type Details = { client_name: string; redirect_host: string; scopes: Scope[] };

function ConsentInner() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = parseRequestId(window.location.search);
    setRequestId(id);
    if (!id) {
      setStage('invalid');
      return;
    }
    if (!getStoredToken()) {
      router.replace(`/login?next=${encodeURIComponent(consentPath(id))}`);
      return;
    }
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        clearAuthSession();
        router.replace(`/login?next=${encodeURIComponent(consentPath(id))}`);
        return;
      }
      setUser(me);
      try {
        const res = await fetch(`${API_BASE}/v1/oauth/requests/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${getStoredToken() || ''}` } });
        if (!res.ok) throw new Error('invalid');
        if (!cancelled) {
          const d = (await res.json()) as Details;
          setDetails(d);
          setChosen(Object.fromEntries(d.scopes.map((x) => [x.id, Boolean(x.required || x.default)])));
          setStage('confirm');
        }
      } catch {
        if (!cancelled) setStage('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function decide(approve: boolean) {
    if (!requestId || !details) return;
    setStage('working');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/v1/oauth/requests/${encodeURIComponent(requestId)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken() || ''}` },
        body: JSON.stringify({ approve, scopes: Object.entries(chosen).filter(([, on]) => on).map(([id]) => id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Could not complete this. Please start again from your assistant.');
      }
      const { redirect } = (await res.json()) as { redirect?: string };
      // Only ever go back to the host the person was shown above.
      if (!isSafeRedirect(redirect, details.redirect_host)) throw new Error('Unexpected response. Please start again from your assistant.');
      setStage(approve ? 'sent' : 'cancelled');
      window.location.assign(redirect as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('error');
    }
  }

  function switchAccount() {
    clearAuthSession();
    router.replace(`/login?next=${encodeURIComponent(consentPath(requestId || ''))}`);
  }

  const app = details?.client_name || 'this app';
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F1E8] dark:bg-[#14110F] px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#E3836C]/20 bg-white/70 dark:bg-white/[0.03] p-8 shadow-sm">
        {stage === 'checking' && (
          <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Checking your account" />
        )}

        {stage === 'invalid' && (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">This link is no longer valid</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Connection links expire after a few minutes. Start again from your AI assistant.</p>
            <Link href="/" className="mt-5 inline-block text-xs font-mono uppercase tracking-wider text-[#E3836C] hover:text-[#ED967F]">Back to analyzeit.si</Link>
          </div>
        )}

        {(stage === 'confirm' || stage === 'working' || stage === 'error') && details && (
          <>
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Connect {app} to AnalyzeIt?</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">
              Signed in as <strong className="text-[#2B2620] dark:text-[#EDE6DD]">{user?.email}</strong>. After you allow, you will be sent back to{' '}
              <strong className="text-[#2B2620] dark:text-[#EDE6DD]">{details.redirect_host}</strong>.
            </p>

            <div className="mt-5 rounded-xl border border-[#E3836C]/20 p-4 text-sm text-[#3F3830] dark:text-[#E6DCD2]">
              <p className="font-medium">{app} will be able to:</p>
              <ul className="mt-2 space-y-2">
                {details.scopes.map((sc) => (
                  <li key={sc.id}>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(chosen[sc.id])}
                        disabled={Boolean(sc.required) || stage === 'working'}
                        onChange={(e) => setChosen((c) => ({ ...c, [sc.id]: e.target.checked }))}
                      />
                      <span>
                        {sc.description}
                        {!sc.required ? <span className="ml-1 text-xs text-[#4A4238]/60 dark:text-[#91867E]">(optional, off unless you tick it)</span> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#4A4238]/70 dark:text-[#91867E]">
                It sees nothing until you allow AI access to a project’s data in that project’s settings, and you can disconnect it any time under Profile → Connected AI apps.
                It never receives your password.
              </p>
            </div>

            <p className="mt-4 text-xs text-[#4A4238]/60 dark:text-[#91867E]">Only continue if you just started this from {app}. If you did not, choose Cancel.</p>
            {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-[#D97870]">{error}</p>}
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" onClick={() => decide(true)} disabled={stage === 'working'} className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#1a0f0b] hover:bg-[var(--brand-hover)] disabled:opacity-60">
                {stage === 'working' ? 'Connecting…' : 'Allow'}
              </button>
              <button type="button" onClick={() => decide(false)} disabled={stage === 'working'} className="rounded-lg border border-[#E3836C]/25 px-4 py-2.5 text-sm text-[#4A4238] dark:text-[#C9BFB5] hover:bg-[var(--brand)]/10 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={switchAccount} className="mt-1 text-xs text-[#4A4238]/60 dark:text-[#91867E] hover:text-[#E3836C]">
                Use a different account
              </button>
            </div>
          </>
        )}

        {stage === 'sent' && (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Connected. Returning to {app}…</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">If nothing happens, go back to your assistant: it is connected now.</p>
          </div>
        )}

        {stage === 'cancelled' && (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Not connected</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Nothing was shared. You can close this page.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F1E8] dark:bg-[#14110F]" />}>
      <ConsentInner />
    </Suspense>
  );
}
