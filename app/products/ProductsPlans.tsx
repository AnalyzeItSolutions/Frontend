'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBillingQuote } from '../lib/billingApi';
import { presentPlans, type MarketingQuote } from '../lib/planCatalog.mjs';
import { useVisitorCountry } from '../lib/useVisitorCountry';
import { CountryTrust } from '../Components/trust/CountryTrust';
import { IntervalToggle, type Interval } from '../Components/trust/IntervalToggle';

const CTA = { free: 'Create a free account', premium: 'Sign in to upgrade', premium_plus: 'Sign in to go VIP' } as const;
const HREF = { free: '/login?tab=register', premium: '/login?next=/billing', premium_plus: '/login?next=/billing' } as const;

/**
 * Same plans, features and prices as the homepage.
 * `initialQuote` is the server-loaded India quote so the first HTML is whole rupees,
 * not the USD-only fallback the homepage has already replaced.
 */
export function ProductsPlans({ initialQuote = null }: { initialQuote?: MarketingQuote }) {
  const [quote, setQuote] = useState<MarketingQuote>(initialQuote ?? null);
  const country = useVisitorCountry();
  const [interval, setInterval] = useState<Interval>('monthly');
  useEffect(() => {
    let cancelled = false;
    getBillingQuote(country ?? 'IN')
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        // Keep initialQuote. Clearing it would show Premium in USD after the server already had INR.
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return (
    <>
    <div className="mb-4 flex justify-center">
      <IntervalToggle value={interval} onChange={setInterval} />
    </div>
    <div className="grid items-stretch gap-4 sm:grid-cols-3">
      {presentPlans(quote, interval).map((plan) => {
        const recommended = plan.id === 'premium';
        return (
          <article
            key={plan.id}
            className={`flex flex-col rounded-2xl border p-5 ${
              recommended
                ? 'border-[#414141]/12 dark:border-[#262626] border-t-2 border-t-[#E4E4E2] bg-[#F9F9F9]/70 dark:bg-[#262626] shadow-[0_10px_28px_-14px_rgba(255, 255, 255,0.45)] -translate-y-0.5'
                : 'border-[#414141]/12 dark:border-[#262626] bg-white/40 dark:bg-[#1B1B1B]/60'
            }`}
          >
            <h2 className="font-serif text-2xl text-[#2D2D2D] dark:text-[#EDEDED]">{plan.name}</h2>
            <p className="mt-1 min-h-[2.75rem] text-sm text-[#535353] dark:text-[#BABABA]">{plan.tagline}</p>
            <div className="mt-4 min-h-[4.75rem]">
              <p className="font-serif text-3xl text-[#2D2D2D] dark:text-[#EDEDED]">
                {plan.price}
                <span className="font-sans text-base">{plan.id === 'free' ? '/mo' : plan.period}</span>
              </p>
              <p className="text-xs text-[#535353] dark:text-[#BABABA]">{plan.note}</p>
            </div>
            <ul className="mb-5 mt-4 flex-1 space-y-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-[#141414]" aria-hidden>·</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={HREF[plan.id]}
              className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
                plan.id === 'free'
                  ? 'border border-[#E4E4E2]/55 bg-transparent text-[#141414] hover:border-[#E4E4E2] hover:bg-[var(--brand)]/8'
                  : 'bg-[#E4E4E2] text-white hover:bg-[#E4E4E2]'
              }`}
            >
              {CTA[plan.id]}
            </Link>
          </article>
        );
      })}
    </div>
    <CountryTrust className="mt-6" />
    </>
  );
}
