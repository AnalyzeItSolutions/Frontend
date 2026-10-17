import React from 'react';
import Link from 'next/link';

export const ClosingCTASection: React.FC = () => {
  return (
    <section className="relative py-32 md:py-48 px-6 md:px-16 max-w-5xl mx-auto text-center space-y-8 pointer-events-auto">
      <p className="eyebrow">Start with your payments</p>

      <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl text-[var(--text-primary)] font-normal leading-[1.08] max-w-3xl mx-auto">
        Find out what your payments are quietly losing.
      </h2>

      <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
        Connect your payments, ask what is going wrong, and check every figure yourself.
      </p>

      <div className="pt-4 space-y-3">
        <Link
          href="/login?tab=register"
          className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-pressed)] text-[var(--brand-ink)] font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          Create an account
        </Link>
        <div className="text-xs text-[var(--text-secondary)] font-mono">
          Preview access · billing not required
        </div>
        <div className="pt-4 text-sm text-[var(--text-secondary)]">
          Or keep your data on your own computer:{' '}
          <Link href="/download" className="font-semibold text-[var(--accent-text)] underline underline-offset-4">
            download AnalyzeIt for desktop and the command line
          </Link>
          .
        </div>
      </div>
    </section>
  );
};
