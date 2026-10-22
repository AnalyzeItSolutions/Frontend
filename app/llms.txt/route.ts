import { llmsTxt } from '../lib/pseo/llms';

// A map of the site for AI assistants (llmstxt.org). Static: rebuilt with every deploy.
export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
