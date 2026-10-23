import type { Metadata } from 'next';
import { Navbar } from '../Components/landing/Navbar';
import { TryoutClient } from './TryoutClient';

export const metadata: Metadata = {
  title: 'Try AnalyzeIt: 5 free runs',
  description: 'Ask AnalyzeIt a question and get a real answer, no account needed. Five free runs, then create a free account to keep going.',
  alternates: { canonical: '/try' },
};

export default function TryPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <Navbar />

      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-32 sm:pt-40">
        <h1 className="font-serif text-4xl text-[var(--text-primary)] sm:text-5xl">Start analyzing now.</h1>
        <p className="mb-8 mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
          Ask a question and get a real answer. No account for your first five runs.
        </p>
        <TryoutClient />
      </main>
    </div>
  );
}
