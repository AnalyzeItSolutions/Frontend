'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBillingQuote } from '../../lib/billingApi';
import { presentPlans, type MarketingQuote } from '../../lib/planCatalog.mjs';
import { useVisitorCountry } from '../../lib/useVisitorCountry';
import { CountryTrust } from '../trust/CountryTrust';
import { IntervalToggle, type Interval } from '../trust/IntervalToggle';

const CTA = { free: 'Create a free account', premium: 'Sign in to upgrade', premium_plus: 'Sign in to go VIP' } as const;
const HREF = { free: '/login?tab=register', premium: '/login?next=/billing', premium_plus: '/login?next=/billing' } as const;

export const PricingTeaserSection: React.FC<{ initialQuote?: MarketingQuote }> = ({ initialQuote = null }) => {
  const [quote, setQuote] = useState<MarketingQuote>(initialQuote ?? null);
  const country = useVisitorCountry();
  const [interval, setInterval] = useState<Interval>('monthly');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // The quote is in the visitor's currency (INR for India).
        const q = await getBillingQuote(country ?? 'IN');
        if (!cancelled) setQuote(q);
      } catch {
        // Keep the quote already on screen. Dropping it would show USD after INR was known.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const tiers = presentPlans(quote, interval).map((plan) => ({
    ...plan,
    popular: plan.id === 'premium',
    features: plan.id === 'free' ? plan.features : [...plan.features, 'Monthly billing after you sign in'],
    cta: CTA[plan.id],
    href: HREF[plan.id],
  }));

  return (
    <section
      id="pricing"
      className="relative py-24 md:py-36 px-6 md:px-16 max-w-7xl mx-auto space-y-16 pointer-events-auto scroll-mt-[calc(var(--nav-h,96px)+16px)]"
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-[var(--accent-text)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
          Plans
        </div>
        <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] font-normal">
          Fair pricing for quiet research.
        </h2>
        <p className="text-base text-[var(--text-primary)]">
          Chat, dashboards, Globe, and connectors need an account. Paid plans are billed through our payment processor in your
          local currency (INR in India). The USD figure is a reference; the exact price is confirmed at checkout.
        </p>
      </div>

      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              tier.popular
                ? 'border-[#F2F2F2]/40 bg-[#F9F9F9] dark:bg-[#262626] shadow-lg'
                : 'border-[#414141]/12 dark:border-[var(--border)] bg-[var(--surface)]'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--brand)] text-[var(--brand-ink)]">
                Recommended
              </span>
            )}
            <div className="space-y-1 mb-6">
              <h3 className="font-serif text-2xl text-[var(--text-primary)]">{tier.name}</h3>
              <p className="text-sm text-[#383838] dark:text-[#BABABA]">{tier.tagline}</p>
            </div>
            <div className="mb-2">
              <span className="font-serif text-4xl text-[var(--text-primary)]">{tier.price}</span>
              <span className="text-sm text-[var(--text-secondary)]">{tier.period}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">{tier.note}</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="text-sm text-[#383838] dark:text-[#BABABA] flex gap-2">
                  <span className="text-[var(--accent-text)]" aria-hidden="true">
                    ·
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={tier.href}
              className={`inline-flex justify-center min-h-11 items-center rounded-full px-5 py-3 text-sm font-medium transition ${
                tier.name === 'Free'
                  ? 'border border-[#414141]/20 dark:border-[#484848] text-[var(--text-primary)] hover:border-[var(--coral,#F2F2F2)] hover:text-[var(--coral,#F2F2F2)]'
                  : 'bg-[var(--coral,#F2F2F2)] text-[var(--brand-ink)] hover:bg-[var(--brand-hover)]'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <CountryTrust className="max-w-4xl mx-auto" />

      <p className="text-center text-sm text-[var(--text-secondary)] max-w-2xl mx-auto">
        Hit a Free limit mid-research? Upgrade from Billing after sign-in — your work stays;
        entitlements change.
      </p>
    </section>
  );
};
