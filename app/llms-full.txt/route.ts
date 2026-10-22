import { llmsFullTxt } from '../lib/pseo/llms';

// The metric and method pages as plain text, for assistants that read a whole site in one request.
export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsFullTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
