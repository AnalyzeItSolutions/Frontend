import { NextResponse } from 'next/server';
import { DOWNLOAD_BASE } from '../../lib/downloads.mjs';

// The file list the install scripts read (product os arch kind sha256 size url). Relayed from storage so
// the scripts only ever talk to this site.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${DOWNLOAD_BASE.replace(/\/$/, '')}/install.txt`, { cache: 'no-store' });
    if (!res.ok) return new NextResponse('No release is published yet.\n', { status: 404 });
    const text = await res.text();
    // Every line must look like a file entry on https; anything else means storage returned something unexpected.
    const ok = text.split('\n').filter(Boolean).every((l) => /^(desktop|cli) (macos|windows|linux) (arm64|x64) [a-z-]+ [0-9a-f]{64} \d+ https:\/\/\S+$/.test(l));
    if (!ok) return new NextResponse('The release list is not valid.\n', { status: 502 });
    return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
  } catch {
    return new NextResponse('Release information is unavailable right now.\n', { status: 502 });
  }
}
