import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '../ui/Brand';
import { LEGAL_NAME, REGISTERED_ADDRESS } from '../../lib/legalEntity';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--border)] py-16 md:py-24 px-6 md:px-16 max-w-7xl mx-auto space-y-16 pointer-events-auto">
      {/* Top row: Brand + 4 Columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
        {/* Brand column */}
        <div className="col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} />
          </Link>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
            Ask your data anything. Memory that lasts, on far fewer tokens, with every number checkable line by line.
          </p>
        </div>

        {/* Product */}
        <div className="space-y-3 text-sm">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            Product
          </div>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li><Link href="/#hero" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Overview</Link></li>
            <li><Link href="/#descent" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">3D Descent</Link></li>
            <li><Link href="/#capabilities" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Capabilities</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">How it works</Link></li>
            <li><Link href="/#pricing" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Pricing</Link></li>
          </ul>
        </div>

        {/* Workspace */}
        <div className="space-y-3 text-sm">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            Workspace
          </div>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li><Link href="/login" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Sign In</Link></li>
            <li><Link href="/login?tab=register" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Create account</Link></li>
            <li><Link href="/demo" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Try the demo</Link></li>
            <li><Link href="/case" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Watch a case run</Link></li>
            <li><Link href="/docs" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Docs</Link></li>
            <li><Link href="/guides" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Guides</Link></li>
            <li><Link href="/cases" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Worked examples</Link></li>
            <li><Link href="/metrics" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Business metrics</Link></li>
            <li><Link href="/methods" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Statistics methods</Link></li>
            <li><Link href="/changelog" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Changelog</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        {/* Resources & Legal */}
        <div className="space-y-3 text-sm">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            Security &amp; Terms
          </div>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li><Link href="/#faq" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">FAQ</Link></li>
            <li><Link href="/security" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Security</Link></li>
            <li><Link href="/terms" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Terms and Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refund" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Cancellation and Refund</Link></li>
            <li><Link href="/shipping" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Shipping and Exchange</Link></li>
            <li><Link href="/products" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Products</Link></li>
            <li><Link href="/download" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Download</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Contact Us</Link></li>
            <li><Link href="/cookies" className="hover:text-[var(--accent-text)] dark:hover:text-[var(--accent-text)] transition-colors">Cookies</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] font-mono">
        <div className="max-w-xl leading-relaxed">
          © {new Date().getFullYear()} AnalyzeIt. Operated by {LEGAL_NAME}, {REGISTERED_ADDRESS}.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/security" className="hover:text-[var(--accent-text)] transition-colors">Security</Link>
          <Link href="/acceptable-use" className="hover:text-[var(--accent-text)] transition-colors">Acceptable use</Link>
          <Link href="/dpa" className="hover:text-[var(--accent-text)] transition-colors">DPA</Link>
        </div>
      </div>
    </footer>
  );
};
