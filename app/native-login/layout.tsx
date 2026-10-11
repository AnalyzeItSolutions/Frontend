import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in to the AnalyzeIt app',
  robots: { index: false, follow: false },
};

export default function NativeLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
