import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '../Components/ui/Brand';
import { ThemeToggle } from '../Components/ui/ThemeToggle';
import { TryoutClient } from './TryoutClient';

export const metadata: Metadata = {
  title: 'Try AnalyzeIt: 5 free runs',
  description: 'Ask AnalyzeIt a question and get a real answer, no account needed. Five free runs, then create a free account to keep going.',
  alternates: { canonical: '/try' },
};

export default function TryPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <nav className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size={26} />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link
            href="/login?tab=register"
            className="hidden rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-medium text-[var(--brand-ink)] transition-colors hover:bg-[var(--brand-hover)] sm:inline-flex"
          >
            Create account
          </Link>
        </div>
      </nav>

      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-12 sm:pt-16">
        <h1 className="font-serif text-4xl text-[var(--text-primary)] sm:text-5xl">Start analyzing now.</h1>
        <p className="mb-8 mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
          Ask a question and get a real answer. No account for your first five runs.
        </p>
        <TryoutClient />
      </main>
    </div>
  );
}
