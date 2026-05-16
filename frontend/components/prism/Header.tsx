'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import '@/app/prism-design-system.css';
import { cn } from './cn';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo: React.ReactNode;
  navItems: NavItem[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * Sticky navigation header for the Prism design system.
 * Features frosted glass background and a slide-in mobile drawer.
 */
export default function Header({ logo, navItems, ctaLabel, ctaHref }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'prism-header',
          scrolled && 'scrolled'
        )}
      >
        <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto px-prism-7">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              {logo}
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-prism-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-prism-body-sm font-normal text-prism-ink transition-colors duration-200 hover:text-prism-graphite"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              href={ctaHref}
              className="prism-btn"
            >
              {ctaLabel}
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center p-2 text-prism-ink"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-prism-ink/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute right-0 top-[3.25rem] bottom-0 w-[min(20rem,85vw)] bg-prism-canvas shadow-prism-sm flex flex-col animate-prism-fade-in">
            <nav className="flex flex-col p-prism-7 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-prism-body font-normal text-prism-ink py-prism-3 px-prism-4 rounded-prism-md transition-colors duration-200 hover:bg-prism-fog"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-prism-7">
              <Link
                href={ctaHref}
                className="prism-btn w-full"
                onClick={() => setMobileOpen(false)}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
