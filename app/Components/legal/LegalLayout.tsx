import Link from 'next/link';
import { BrandLogo } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
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
    <p className="text-sm text-[#414141]/50 dark:text-[#888888] mb-10">
      Last updated {updated}
    </p>
  ) : (
    <div className="mb-10" />
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo size={26} />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-wider text-[#414141]/50 dark:text-[#888888] hover:text-[#F2F2F2] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login?tab=register"
            className="hidden sm:inline-flex text-xs font-medium px-4 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[var(--brand)] text-[var(--brand-ink)] transition-colors"
          >
            Create account
          </Link>
        </div>
      </nav>

      <main id="main-content" className="flex-1 w-full max-w-3xl mx-auto px-6 py-14 sm:py-20">
        {eyebrow !== false ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#414141]/45 dark:text-[#888888] mb-3">
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

        <nav className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono uppercase tracking-wider text-[#414141]/50 dark:text-[#888888]">
          {LEGAL_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[#F2F2F2] transition-colors">
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
