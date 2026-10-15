'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Floating Pill Header */}
      <header className="fixed top-5 sm:top-6 left-0 right-0 z-40 flex justify-center px-4 sm:px-6 pointer-events-none">
        <nav
          className={`pointer-events-auto flex w-full max-w-full md:w-auto items-center justify-between gap-3 sm:gap-8 px-4 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all duration-300 bg-[var(--surface)]/95 backdrop-blur-md shadow-[var(--shadow-sm)] text-[var(--text-primary)] border border-[var(--border)] ${
            scrolled
              ? 'shadow-md shadow-black/10'
              : 'shadow-xs'
          }`}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <BrandLogo size={26} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium tracking-wide text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => scrollTo('capabilities')}
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1"
            >
              Capabilities
            </button>
            <button
              type="button"
              onClick={() => scrollTo('how-it-works')}
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollTo('comparison')}
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1"
            >
              Why not a chatbot
            </button>
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('faq')}
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1"
            >
              FAQ
            </button>
            <Link
              href="/download"
              className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1 inline-flex items-center font-semibold text-[var(--accent-text)]"
            >
              Download
            </Link>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline text-xs whitespace-nowrap text-[var(--text-secondary)] hover:text-[var(--accent-text)] font-medium px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login?tab=register"
              className="text-xs whitespace-nowrap bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--brand-ink)] font-medium px-4 py-1.5 rounded-full transition-all duration-200 shadow-xs"
            >
              Get started
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1 text-[var(--text-primary)] cursor-pointer ml-1"
              aria-label="Toggle Menu"
            >
              <span
                className={`w-4 h-[1.5px] bg-[var(--text-primary)] transition-transform ${
                  mobileMenuOpen ? 'rotate-45 translate-y-[3.5px]' : ''
                }`}
              />
              <span
                className={`w-4 h-[1.5px] bg-[var(--text-primary)] transition-transform ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[var(--bg)]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 text-sm font-mono tracking-widest uppercase md:hidden text-[var(--text-primary)]">
          <button
            type="button"
            onClick={() => scrollTo('capabilities')}
            className="text-base text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
          >
            Capabilities
          </button>
          <button
            type="button"
            onClick={() => scrollTo('how-it-works')}
            className="text-base text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollTo('comparison')}
            className="text-base text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
          >
            Why not a chatbot
          </button>
          <button
            type="button"
            onClick={() => scrollTo('pricing')}
            className="text-base text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => scrollTo('faq')}
            className="text-base text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
          >
            FAQ
          </button>
          <Link
            href="/download"
            className="text-base font-semibold text-[var(--accent-text)] hover:text-[var(--accent-text)] transition-colors"
          >
            Download
          </Link>
          <div className="pt-4 flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-full border border-[var(--border-strong)] text-xs font-mono uppercase text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--accent-text)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=register"
              className="px-6 py-2 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-xs font-mono uppercase text-[var(--brand-ink)] transition-colors shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
