import type { Metadata } from 'next';
import Link from 'next/link';
import { SharedDashboard } from '../../Components/dashboard/SharedDashboard';
import type { WidgetSpec } from '../../lib/chatApi';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SharedProject {
  title: string;
  description?: string;
  widgets: WidgetSpec[];
  shared_at?: string | null;
}

async function loadShared(token: string): Promise<SharedProject | null> {
  try {
    // Never cached: when the owner turns the link off it has to stop working at once.
    const res = await fetch(`${API}/v1/shared/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SharedProject;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Shared dashboard',
  robots: { index: false, follow: false }, // a shared link is private to whoever has it
};

export default async function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadShared(token);
  if (!data) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="font-serif text-2xl">This dashboard is no longer shared</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">The owner may have turned the link off, or it may be mistyped.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--coral)]">Go to AnalyzeIt</Link>
      </main>
    );
  }
  const date = data.shared_at ? new Date(data.shared_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '';
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-widest text-[var(--text-primary)]">Shared read-only dashboard{date ? ` · shared ${date}` : ''}</p>
      <h1 className="mt-2 font-serif text-3xl">{data.title}</h1>
      {data.description ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{data.description}</p> : null}
      <SharedDashboard widgets={Array.isArray(data.widgets) ? data.widgets : []} />
      <p className="mt-10 text-xs text-[var(--text-muted)]">
        A snapshot of the owner&apos;s dashboard. It can only be viewed.{' '}
        <Link href="/" className="underline">Try AnalyzeIt</Link>
      </p>
    </main>
  );
}
