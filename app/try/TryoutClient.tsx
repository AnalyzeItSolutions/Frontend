'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChatMarkdown } from '../Components/chat/ChatMarkdown';
import { SourceChips } from '../Components/research/SourceChips';
import { TryoutFailure, askTryout, getTryoutStatus, type TryoutStatus } from '../lib/tryoutApi';
import { TRYOUT_EXAMPLES, explainTryoutFailure, formatWait, runsLabel } from '../lib/tryout.mjs';
import type { DemoResult } from '../lib/demoChat.mjs';
import { warmAgent } from '../lib/warmApi';

type Turn = { question: string; result?: DemoResult; failure?: { kind: string; message: string } };

/** A few real model runs with no account. The server enforces every limit; this page only shows them. */
export function TryoutClient() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [status, setStatus] = useState<TryoutStatus | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    warmAgent({ guest: true });
    void getTryoutStatus().then(setStatus);
    return () => abortRef.current?.abort();
  }, []);

  // The answer lands under the form, often below the fold: bring it into view as soon as a run starts and again when it arrives.
  useEffect(() => {
    if (!turn) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [turn]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setSlow(false);
    setTurn({ question: q });
    const slowTimer = window.setTimeout(() => setSlow(true), 6000);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await askTryout(q, controller.signal);
      setTurn(result.error && !result.answer ? { question: q, failure: { kind: 'error', message: result.error.message || 'The run could not be completed.' } } : { question: q, result });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setTurn({ question: q, failure: err instanceof TryoutFailure ? explainTryoutFailure(err.status, err.detail) : explainTryoutFailure(0, null) });
    } finally {
      window.clearTimeout(slowTimer);
      setBusy(false);
      setSlow(false);
      void getTryoutStatus().then(setStatus);
    }
  };

  const out = status !== null && status.remaining <= 0;
  const unavailable = status !== null && !status.available;
  return (
    <div className="flex min-h-[calc(100svh-17rem)] flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Example questions">
        {TRYOUT_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={busy || out}
            onClick={() => {
              setInput(ex.question);
              void ask(ex.question);
            }}
            className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div ref={resultRef} className="scroll-mt-6 flex-1 space-y-4">
        {busy && turn ? (
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" aria-busy="true">
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">{turn.question}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden />
              {slow ? 'Still working. The first run after a quiet spell can take about 30 seconds…' : 'Working on it…'}
            </p>
          </article>
        ) : null}

        {!busy && turn?.result ? (
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]" aria-live="polite">
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">{turn.question}</p>
            <div className="mt-3 text-base leading-relaxed text-[var(--text-primary)]">
              <ChatMarkdown text={turn.result.answer || 'No answer came back.'} />
            </div>
            <SourceChips sources={turn.result.sources} />
          </article>
        ) : null}
      </div>

      {turn?.failure ? (
        <div role="alert" className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5 text-[var(--text-primary)]">
          <p className="text-sm">{turn.failure.message}</p>
          {turn.failure.kind === 'limit' ? (
            <Link href="/login?tab=register" className="mt-3 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover">
              Create a free account
            </Link>
          ) : null}
        </div>
      ) : null}

      {out && !turn?.failure ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm">
          <p>
            You have used all {status?.limit} try-out runs. Create a free account to keep going
            {status && status.retry_after_seconds > 0 ? `, or come back in ${formatWait(status.retry_after_seconds)}.` : '.'}
          </p>
          <Link href="/login?tab=register" className="mt-3 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-ink hover:bg-brand-hover">
            Create a free account
          </Link>
        </div>
      ) : null}

      {unavailable ? <p className="text-sm text-[var(--text-primary)]">The try-out is unavailable right now. Please try again in a few minutes.</p> : null}

      <form
        className="sticky bottom-0 z-10 -mx-6 space-y-3 border-t border-[var(--border)] bg-[var(--bg)]/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={400}
          rows={2}
          placeholder="Ask a question about analysing data, metrics or a business problem…"
          aria-label="Your question"
          className="w-full resize-none rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--text-secondary)] focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]" role="status">
            {status && status.available ? runsLabel(status.remaining, status.limit) : ''}
          </p>
          <button
            type="submit"
            disabled={busy || out || unavailable || !input.trim()}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Ask'}
          </button>
        </div>
      </form>
    </div>
  );
}
