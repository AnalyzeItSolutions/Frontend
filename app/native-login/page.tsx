'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuthSession, fetchMe, getStoredToken, type UserProfile } from '../lib/auth';
import { clientLabel, isSafeCallback, nativeLoginPath, parseNativeParams } from '../lib/nativeLogin.mjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Stage = 'checking' | 'invalid' | 'confirm' | 'working' | 'sent' | 'cancelled' | 'error';

function NativeLoginInner() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [req, setReq] = useState<ReturnType<typeof parseNativeParams>>(null);

  useEffect(() => {
    const parsed = parseNativeParams(window.location.search);
    setReq(parsed);
    if (!parsed) {
      setStage('invalid');
      return;
    }
    if (!getStoredToken()) {
      router.replace(`/login?next=${encodeURIComponent(nativeLoginPath(window.location.search))}`);
      return;
    }
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        clearAuthSession();
        router.replace(`/login?next=${encodeURIComponent(nativeLoginPath(window.location.search))}`);
        return;
      }
      setUser(me);
      setStage('confirm');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function allow() {
    if (!req) return;
    setStage('working');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/v1/auth/native/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken() || ''}` },
        body: JSON.stringify({ challenge: req.challenge, state: req.state, port: req.port, client: req.client }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Could not authorize the app. Please try again.');
      }
      const { redirect } = (await res.json()) as { redirect?: string };
      // Never navigate anywhere but the app's own loopback listener.
      if (!isSafeCallback(redirect, req.port, req.state)) throw new Error('Unexpected response. Please start again from the app.');
      setStage('sent');
      window.location.assign(redirect as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('error');
    }
  }

  function switchAccount() {
    clearAuthSession();
    router.replace(`/login?next=${encodeURIComponent(nativeLoginPath(window.location.search))}`);
  }

  const who = req ? clientLabel(req.client) : 'the app';
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F1E8] dark:bg-[#14110F] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#E3836C]/20 bg-white/70 dark:bg-white/[0.03] p-8 text-center shadow-sm">
        {stage === 'checking' && (
          <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#E3836C]/25 border-t-[#E3836C]" aria-label="Checking your account" />
        )}

        {stage === 'invalid' && (
          <>
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">This link is not valid</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Start the sign-in again from the AnalyzeIt app or command line.</p>
            <Link href="/" className="mt-5 inline-block text-xs font-mono uppercase tracking-wider text-[#E3836C] hover:text-[#ED967F]">Back to analyzeit.si</Link>
          </>
        )}

        {(stage === 'confirm' || stage === 'working' || stage === 'error') && (
          <>
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Sign in to {who}</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">
              Allow {who} to use your AnalyzeIt account{user?.email ? <> as <strong className="text-[#2B2620] dark:text-[#EDE6DD]">{user.email}</strong></> : null}?
            </p>
            <p className="mt-2 text-xs text-[#4A4238]/55 dark:text-[#91867E]">Only continue if you just started this from the app on this computer.</p>
            {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-[#D97870]">{error}</p>}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={allow}
                disabled={stage === 'working'}
                className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#1a0f0b] hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                {stage === 'working' ? 'Connecting…' : 'Allow'}
              </button>
              <button type="button" onClick={() => setStage('cancelled')} className="rounded-lg border border-[#E3836C]/25 px-4 py-2.5 text-sm text-[#4A4238] dark:text-[#C9BFB5] hover:bg-[var(--brand)]/10">
                Cancel
              </button>
              <button type="button" onClick={switchAccount} className="mt-1 text-xs text-[#4A4238]/60 dark:text-[#91867E] hover:text-[#E3836C]">
                Use a different account
              </button>
            </div>
          </>
        )}

        {stage === 'sent' && (
          <>
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Returning to the app…</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">If nothing happens, the app may have been closed. Start the sign-in again from it.</p>
          </>
        )}

        {stage === 'cancelled' && (
          <>
            <h1 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Sign-in cancelled</h1>
            <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Nothing was shared. You can close this page.</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function NativeLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F1E8] dark:bg-[#14110F]" />}>
      <NativeLoginInner />
    </Suspense>
  );
}
