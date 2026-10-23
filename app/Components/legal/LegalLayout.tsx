import Link from 'next/link';
import { Navbar } from '../landing/Navbar';
import { Footer } from '../landing/Footer';
import { OperatorBlock } from './OperatorBlock';

export const LEGAL_NAV = [
  { href: '/terms', label: 'Terms and Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund', label: 'Cancellation and Refund' },
  { href: '/shipping', label: 'Shipping and Exchange' },
  { href: '/products', label: 'Products' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/security', label: 'Security' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/acceptable-use', label: 'Acceptable use' },
  { href: '/dpa', label: 'DPA' },
] as const;

export function LegalLayout({
  title,
  updated,
  subtitle,
  eyebrow = 'Legal',
  showHeroUpdated = true,
  quietOperator = false,
  children,
}: {
  title: string;
  updated?: string;
  /** Short line under the H1 (replaces last-updated in the hero when set). */
  subtitle?: string;
  /** Pass `false` to hide the Legal eyebrow. */
  eyebrow?: string | false;
  /** When false, last-updated is omitted from the hero (can move to OperatorBlock). */
  showHeroUpdated?: boolean;
  /** Softer, footer-adjacent operator block. */
  quietOperator?: boolean;
  children: React.ReactNode;
}) {
  const heroMeta = subtitle ? (
    <p className="text-base text-[var(--text-secondary)] mb-10 max-w-2xl leading-relaxed">
      {subtitle}
    </p>
  ) : showHeroUpdated && updated ? (
    <p className="text-sm text-[var(--text-muted)] mb-10">
      Last updated {updated}
    </p>
  ) : (
    <div className="mb-10" />
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      <Navbar />

      <main id="main-content" className="flex-1 w-full max-w-3xl mx-auto px-6 pt-32 pb-14 sm:pt-40 sm:pb-20">
        {eyebrow !== false ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-3">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--text-primary)] mb-3">
          {title}
        </h1>
        {heroMeta}

        <article className="legal-prose space-y-8 text-sm sm:text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {children}
          <OperatorBlock
            quiet={quietOperator}
            updated={!showHeroUpdated ? updated : undefined}
          />
        </article>

        <nav className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {LEGAL_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </main>

      <div className="bg-[var(--bg)]">
        <Footer />
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}
