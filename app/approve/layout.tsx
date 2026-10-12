import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review a request — AnalyzeIt',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ApproveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
