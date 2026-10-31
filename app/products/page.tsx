import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { normalizeCountry, COUNTRY_COOKIE } from '../lib/countryProfile.mjs';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { loadMarketingQuote } from '../lib/marketingQuote.mjs';
import { ProductsPlans } from './ProductsPlans';

export const metadata: Metadata = {
  title: 'Pricing: Free, Premium and VIP plans — AnalyzeIt',
  description: 'AnalyzeIt pricing: a Free plan plus Premium and VIP, billed via Razorpay in your local currency (INR in India). The exact price is confirmed at checkout.',
  alternates: { canonical: '/products' },
  category: 'Pricing',
};

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // Seed the quote for the visitor's country so the first HTML is already in their currency
  // (whole rupees in India), not the USD-only fallback shown before the browser fetch returns.
  const country =
    normalizeCountry((await headers()).get('x-vercel-ip-country')) ||
    normalizeCountry((await cookies()).get(COUNTRY_COOKIE)?.value) ||
    'IN';
  const quote = await loadMarketingQuote(country);
  return (
    <LegalLayout
      title="Fair pricing for quiet research."
      updated="September 25, 2026"
      eyebrow={false}
      showHeroUpdated={false}
      quietOperator
      subtitle="Paid plans are billed through Razorpay in your local currency (INR in India). The USD figure is a reference; the exact price is confirmed at checkout."
    >
      <ProductsPlans initialQuote={quote} />

      <p>
        Hit a Free limit mid-research? Upgrade from Billing after sign-in — your work stays;
        entitlements change.
      </p>

      <p className="text-xs text-[var(--text-muted)]">
        Policies:{' '}
        <a href="/refund" className="text-brand hover:underline">
          Refunds and cancellations
        </a>
        {' · '}
        <a href="/shipping" className="text-brand hover:underline">
          digital access (no physical shipping)
        </a>
        {' · '}
        <Link href="/#pricing" className="text-brand hover:underline">
          homepage pricing
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
