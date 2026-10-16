'use client';

import Link from 'next/link';
import { trustProfile } from '../../lib/countryProfile.mjs';
import { EMAIL } from '../../lib/legalEntity';
import { useVisitorCountry } from '../../lib/useVisitorCountry';

/** Trust points that change with the visitor's country: how they pay, what they can cancel, which data law they can cite. */
export function CountryTrust({ className = '' }: { className?: string }) {
  const country = useVisitorCountry();
  const profile = trustProfile(country, EMAIL.privacy);
  return (
    <section aria-label={profile.heading} className={`rounded-2xl border border-[#414141]/12 dark:border-[#262626] bg-[#F9F9F9]/60 dark:bg-[#1B1B1B]/60 p-6 ${className}`}>
      <h3 className="font-serif text-xl text-[var(--text-primary)]">{profile.heading}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {profile.points.map((point) => (
          <li key={point.title}>
            <p className="text-sm font-medium text-[var(--text-primary)]">{point.title}</p>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{point.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        {profile.links.map((link, i) => (
          <span key={link.href}>
            {i > 0 && ' · '}
            <Link href={link.href} className="text-[#141414] hover:underline">{link.label}</Link>
          </span>
        ))}
      </p>
    </section>
  );
}
