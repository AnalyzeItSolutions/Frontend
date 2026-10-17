import React from 'react';
import { CONTEXT_RETENTION_TOKENS, formatContextRetention } from '../../lib/contextWall.mjs';

interface Capability {
  id: string;
  category: string;
  headline: string;
  body: string;
  callout: string;
  calloutDesc: string;
  bullets: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 'globe',
    category: 'Globe',
    headline: 'Explore the world, then ask why.',
    body:
      'Search places, compare hubs, and hand a pin straight into Research. The map gets the whole workspace, not a corner of it.',
    callout: 'Pin to question',
    calloutDesc: 'search, pin, then “Ask about this place”',
    bullets: [
      'Search and browse places with room to see the map',
      'Compare hubs with the map still in view',
      'Send a selected place into Research in one step',
    ],
  },
  {
    id: 'research',
    category: 'Research',
    headline: 'Ask in plain words. See how the answer was made.',
    body:
      'Chat and deep research with answers that show how they were made. Simple calculations, weather, exchange rates and stock prices come from a tool and are labelled “From tools · 0 tokens”, not passed off as written by AI.',
    callout: 'Sources shown',
    calloutDesc: 'each answer says which tool or model made it',
    bullets: [
      'Plain-language questions, with the tool or model named',
      'Zero-token tool paths when a calculator or live feed is enough',
      'Answers come from hosted models, not a model running on your computer',
    ],
  },
  {
    id: 'dashboard',
    category: 'Dashboards',
    headline: 'Dashboards that stay quiet.',
    body:
      'Build living summaries and widgets. Empty dashboards tell you what to add first, and charts use one accent colour so the figure that matters stands out.',
    callout: 'First widget',
    calloutDesc: 'an empty dashboard offers templates',
    bullets: [
      'Plain surfaces with room around each chart',
      'Empty states that invite the first widget',
      'One accent colour for the figure that matters',
    ],
  },
  {
    id: 'connectors-objects',
    category: 'Connectors and objects',
    headline: 'Connect data. Shape objects. Stay honest.',
    body:
      'Each connector shows its real status: connected, ready or error. Import SQL, Stripe, Salesforce, GitHub, or public datasets from Kaggle, Hugging Face and OpenML.',
    callout: 'Real status',
    calloutDesc: 'connected, ready or error',
    bullets: [
      'Connected, ready, and error states you can trust',
      'One word for what you create: objects',
      'Illustrative schema previews when the workspace is empty',
    ],
  },
  {
    id: 'deep-context',
    category: 'Long documents',
    headline: 'Long documents, read section by section.',
    body:
      'Paste a long document and ask a question. On Premium and VIP, AnalyzeIt reads the document one section at a time, notes what each section says about your question, and answers from those notes. Free keeps the most relevant excerpts.',
    callout: 'Deep read',
    calloutDesc: 'you see each section being read',
    bullets: [
      'Premium reads about 150,000 characters; VIP about 300,000',
      'Longer than that: the most relevant sections are read, and the answer says what was not',
      `Your stored files are searched separately, within your memory plan (Free ${formatContextRetention(CONTEXT_RETENTION_TOKENS.free)} · Premium ${formatContextRetention(CONTEXT_RETENTION_TOKENS.premium)} · VIP ${formatContextRetention(CONTEXT_RETENTION_TOKENS.premium_plus)} tokens)`,
    ],
  },
  {
    id: 'reliability',
    category: 'Availability',
    headline: 'Built to stay available.',
    body:
      'The product and its research features run on hosted infrastructure, so the workspace stays reachable while you explore.',
    callout: 'Always on',
    calloutDesc: 'research stays reachable while you work',
    bullets: [
      'Hosted research paths, so exploration stays online',
      'No uptime guarantee is advertised',
      'Account-gated Chat, Globe, dashboards, and connectors',
    ],
  },
];

export const CapabilitiesSection: React.FC = () => {
  return (
    <section
      id="capabilities"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-7xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">Also in the workspace</p>
        <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[var(--text-primary)] leading-tight">
          Everything you need to understand your business,{' '}
          <em className="font-serif not-italic text-[var(--accent-text)]">
            without the noise.
          </em>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.id}
            className="glass-card card-static rounded-3xl p-8 md:p-10 space-y-8 flex flex-col justify-between border border-[var(--border)]"
          >
            <div className="space-y-6">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                {cap.category}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] font-normal leading-snug">
                {cap.headline}
              </h3>
              <p className="text-sm md:text-base text-[var(--text-secondary)] font-normal leading-relaxed">
                {cap.body}
              </p>
              <div className="pt-4 space-y-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  How it works
                </div>
                {cap.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)]"
                  >
                    <span aria-hidden="true" className="text-[var(--success)] text-sm mt-0.5">✓</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8F8]/80 dark:bg-[#262626] border border-[var(--border)] flex items-baseline gap-3">
              <span className="font-serif text-2xl md:text-3xl font-medium text-[var(--accent-text)]">
                {cap.callout}
              </span>
              <span className="text-xs text-[var(--text-secondary)] leading-tight">
                {cap.calloutDesc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
