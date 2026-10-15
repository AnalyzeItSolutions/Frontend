import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browser extension — AnalyzeIt',
  description: 'Post drafts you approved from your own browser, after you confirm. Chrome, Edge, Firefox and Safari.',
  alternates: { canonical: '/extension' },
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
