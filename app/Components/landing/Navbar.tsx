'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useFitsInRow } from '../ui/useFitsInRow';

/** Sections of the landing page; on any other page they link back to it. */
const SECTION_LINKS = [
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'comparison', label: 'Why not a chatbot' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
] as const;

const PAGE_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/download', label: 'Download', accent: true },
] as const;

/** Layout shared by the visible bar and its measuring copy, so both have the same natural width. */
const BAR_CLASS =
  'flex items-center justify-between gap-3 sm:gap-8 lg:gap-4 xl:gap-8 px-4 sm:px-7 lg:px-5 xl:px-7 py-2.5 sm:py-3 rounded-full border';
const ACTIONS_CLASS = 'flex items-center gap-2.5 sm:gap-3 lg:gap-2 xl:gap-3';

/** The site-wide floating navbar: the same links and behaviour on the landing page and every public page. */
export const Navbar: React.FC = () => {
  const pathname = usePathname() || '/';
  const onLanding = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuRequested, setMobileMenuOpen] = useState(false);
  // An invisible copy of the full bar is measured against the header: the links show whenever
  // they fit, and the menu button takes over only when they would overlap.
  const headerRef = useRef<HTMLElement>(null);
  const fullBarRef = useRef<HTMLDivElement>(null);
  const linksFit = useFitsInRow(fullBarRef, headerRef);
  const mobileMenuOpen = menuRequested && linksFit === false;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Every menu link closes the menu; Escape does too, and the page behind it does not scroll.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  const onSectionClick = (e: React.MouseEvent, id: string) => {
    setMobileMenuOpen(false);
    if (!onLanding) return; // the Link takes the visitor to /#id
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const desktopLinks = (
    <div className="flex items-center gap-2 xl:gap-5 text-[13px] xl:text-sm font-medium tracking-wide whitespace-nowrap text-[var(--text-primary)]">
      {SECTION_LINKS.map((s) => (
        <Link
          key={s.id}
          href={`/#${s.id}`}
          onClick={(e) => onSectionClick(e, s.id)}
          className="hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1 inline-flex items-center"
        >
          {s.label}
        </Link>
      ))}
      {PAGE_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isCurrent(l.href) ? 'page' : undefined}
          className={`hover:text-[var(--accent-text)] transition-colors cursor-pointer min-h-11 px-1 inline-flex items-center aria-[current=page]:underline aria-[current=page]:underline-offset-8 ${
            'accent' in l && l.accent ? 'font-semibold text-[var(--accent-text)]' : ''
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );

  const authActions = (
    <>
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
    </>
  );

  return (
    <>
      {/* Floating Pill Header */}
      <header ref={headerRef} className="fixed top-5 sm:top-6 left-0 right-0 z-40 flex justify-center px-4 sm:px-6 pointer-events-none">
        {/* The full bar at its natural width, measured to decide whether the links fit. */}
        <div ref={fullBarRef} aria-hidden className={`invisible absolute left-0 top-0 w-max ${BAR_CLASS}`}>
          <BrandLogo size={26} />
          {desktopLinks}
          <div className={ACTIONS_CLASS}>{authActions}</div>
        </div>

        <nav
          aria-label="Main"
          className={`pointer-events-auto ${BAR_CLASS} ${linksFit ? 'w-auto' : 'w-full'} max-w-full transition-all duration-300 bg-[var(--surface)]/95 backdrop-blur-md shadow-[var(--shadow-sm)] text-[var(--text-primary)] border border-[var(--border)] ${
            scrolled
              ? 'shadow-md shadow-black/10'
              : 'shadow-xs'
          }`}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="AnalyzeIt home"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <BrandLogo size={26} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className={linksFit ? 'flex' : 'hidden'}>{desktopLinks}</div>

          {/* Auth Actions */}
          <div className={ACTIONS_CLASS}>
            {authActions}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${linksFit === false ? '' : 'hidden'} w-11 h-11 -mr-2 flex flex-col items-center justify-center gap-1 text-[var(--text-primary)] cursor-pointer`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="site-mobile-menu"
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
        <div
          id="site-mobile-menu"
          className="fixed inset-0 z-30 bg-[var(--bg)]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 text-sm font-mono tracking-widest uppercase text-[var(--text-primary)]"
        >
          {SECTION_LINKS.map((s) => (
            <Link
              key={s.id}
              href={`/#${s.id}`}
              onClick={(e) => onSectionClick(e, s.id)}
              className="text-base min-h-11 inline-flex items-center text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
            >
              {s.label}
            </Link>
          ))}
          {PAGE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isCurrent(l.href) ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-base min-h-11 inline-flex items-center hover:text-[var(--accent-text)] transition-colors ${
                'accent' in l && l.accent ? 'font-semibold text-[var(--accent-text)]' : 'text-[var(--text-primary)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-4 flex gap-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-6 py-2 rounded-full border border-[var(--border-strong)] text-xs font-mono uppercase text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--accent-text)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=register"
              onClick={() => setMobileMenuOpen(false)}
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
