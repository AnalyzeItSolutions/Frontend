import { NextResponse } from 'next/server';
import { blobUrl, isSafeFilePath } from '../../../lib/downloads.mjs';

// Stable download links. Installers live in storage; this redirects to them, but only for
// `<product>/<x.y.z>/<file>` paths, so it can never be pointed at another site.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!isSafeFilePath(path)) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(blobUrl(path), { status: 302, headers: { 'Cache-Control': 'public, max-age=3600' } });
}
