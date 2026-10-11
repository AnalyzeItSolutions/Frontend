import { NextResponse } from 'next/server';
import { DOWNLOAD_BASE, isValidManifest } from '../../../lib/downloads.mjs';

// Signed update manifest for the cli app. The apps verify the signature themselves, so this route
// only relays what storage holds (and refuses anything malformed); it is not a trust boundary.
export const revalidate = 300;

export async function GET() {
  try {
    const res = await fetch(`${DOWNLOAD_BASE.replace(/\/$/, '')}/cli/latest.json`, { next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json({ error: 'No release is published yet.' }, { status: 404 });
    const manifest = await res.json();
    if (!isValidManifest(manifest)) return NextResponse.json({ error: 'The release information is not valid.' }, { status: 502 });
    return NextResponse.json(manifest, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
  } catch {
    return NextResponse.json({ error: 'Release information is unavailable right now.' }, { status: 502 });
  }
}
