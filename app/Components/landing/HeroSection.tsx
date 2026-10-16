import React from 'react';
import Link from 'next/link';
import { HeroAnswer } from './HeroAnswer';
import { TokenStat } from './TokenStat';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex flex-col justify-between pt-[calc(var(--nav-h,96px)+32px)] pb-20 px-5 sm:px-8 md:px-16 max-w-7xl mx-auto pointer-events-none scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] text-xs font-medium tracking-wide text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
          <span>Read-only access · no customer details stored</span>
        </div>
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-10 lg:gap-12 pointer-events-auto mt-auto pb-10">
        <div
          id="hero-card"
          className="max-w-2xl lg:max-w-xl space-y-6 rounded-3xl bg-[var(--surface)]/92 backdrop-blur-md border border-[var(--border)] p-6 sm:p-8 shadow-[var(--shadow-md)]"
        >
          <h1 className="font-heading text-4xl sm:text-5xl md:text-[3.4rem] tracking-tight text-[var(--text-primary)] font-normal leading-[1.08]">
            Remember everything.{' '}
            <em className="font-heading not-italic text-[var(--accent-text)]">Re‑read nothing.</em>
          </h1>

          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
            AnalyzeIt keeps what it learns about your business in memory and sends the model only what each question needs. Long
            conversations stay sharp, like a bigger context window, on far fewer tokens.
          </p>

          <TokenStat />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <Link
              href="/try"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-pressed)] text-[var(--brand-ink)] font-medium text-base transition-colors duration-200 shadow-sm whitespace-nowrap"
            >
              Start analyzing now
            </Link>
            <Link
              href="/case"
              className="inline-flex items-center min-h-11 py-3 text-sm font-medium text-[var(--accent-text)] underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors"
            >
              Watch a real run, no signup
            </Link>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Prefer your own computer?{' '}
            <Link href="/download" className="font-semibold text-[var(--accent-text)] underline underline-offset-4 hover:text-[var(--text-primary)]">
              Download the desktop app and CLI
            </Link>{' '}
            for macOS, Windows and Linux.
          </p>
        </div>
        <HeroAnswer />
      </div>
    </section>
  );
};
