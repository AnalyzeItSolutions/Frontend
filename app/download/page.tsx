import type { Metadata } from 'next';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { DOWNLOAD_BASE } from '../lib/downloads.mjs';
import { DownloadClient } from './DownloadClient';

export const metadata: Metadata = {
  title: 'Download AnalyzeIt for macOS, Windows and Linux',
  description: 'The AnalyzeIt desktop app and command line. Analyse your files and folders on your own computer, offline, with data encrypted on the device and signed automatic updates.',
  alternates: { canonical: '/download' },
};

export const revalidate = 60;

async function loadReleases() {
  try {
    const res = await fetch(`${DOWNLOAD_BASE.replace(/\/$/, '')}/releases.json`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function DownloadPage() {
  const releases = await loadReleases();
  return (
    <LegalLayout
      title="Download AnalyzeIt"
      eyebrow={false}
      showHeroUpdated={false}
      quietOperator
      subtitle="Analyse the files and folders on your own computer, offline. Your data is encrypted on the device and is never uploaded. The app updates itself, and every update is signed."
    >
      <DownloadClient releases={releases} />
    </LegalLayout>
  );
}
