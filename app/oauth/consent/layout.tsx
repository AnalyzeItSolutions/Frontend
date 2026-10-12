import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect an AI assistant — AnalyzeIt',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
