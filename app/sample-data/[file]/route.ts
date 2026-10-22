import { DATASETS, toCsv } from '../../lib/pseo/data.mjs';

// The made-up sample tables used by /metrics and /methods, as CSV, so readers can run the formulas themselves.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(DATASETS).map((name) => ({ file: `${name}.csv` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = file.replace(/\.csv$/, '') as keyof typeof DATASETS;
  if (!DATASETS[name] || !file.endsWith('.csv')) return new Response('Not found', { status: 404 });
  return new Response(toCsv(name), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `inline; filename="${file}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
