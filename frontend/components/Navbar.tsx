'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

interface NavbarProps {
  transparent?: boolean;
}

const navLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#features', label: 'Features' },
];

export default function Navbar({ transparent: _transparent = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    setMounted(true);
    const updateNavbarOnScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    updateNavbarOnScroll();
    window.addEventListener('scroll', updateNavbarOnScroll);
    return () => window.removeEventListener('scroll', updateNavbarOnScroll);
  }, []);

  if (!mounted) {
    return (
      <nav className="fixed top-0 w-full z-[100] h-[3.5rem] bg-white/80 backdrop-blur-[24px] saturate-180 border-b border-black/5">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black/10 rounded-lg" />
            <div className="h-5 w-20 bg-black/10 rounded" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed top-0 w-full z-[100] h-[3.5rem] bg-white/80 backdrop-blur-[24px] saturate-180 border-b transition-all duration-300 ${
        scrolled ? 'border-black/5 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-medium leading-none">ॐ</span>
            </div>
            <span className="text-lg font-medium text-black tracking-[-0.02em]">
              AI Pandit
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.875rem] font-medium text-black/60 hover:text-black transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA & Auth */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            {isLoaded && isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <button className="px-5 py-2 text-sm font-medium text-white rounded-full bg-black hover:bg-black/85 transition-all duration-300">
                    Dashboard
                  </button>
                </Link>
                <div className="border border-black/10 rounded-full p-0.5">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-5 py-2 text-sm font-normal text-black/60 hover:text-black transition-colors duration-200">
                    Sign In
                  </button>
                </Link>
                <Link href="/rectify">
                  <button className="px-5 py-2 text-sm font-medium text-white rounded-full bg-black hover:bg-black/85 transition-all duration-300">
                    Start Analysis
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Auth icon + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {isLoaded && isSignedIn && (
              <div className="border border-black/10 rounded-full p-0.5">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-[16px] bg-black/[0.04] border border-black/5 text-black transition-all duration-200"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden mx-4 mt-2 bg-white rounded-3xl shadow-lg border border-black/5 overflow-hidden">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-normal text-black/70 hover:text-black hover:bg-black/5 rounded-xl transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-black/5 mt-3 space-y-2">
              {isLoaded && isSignedIn ? (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <button className="w-full px-4 py-3 text-sm font-medium text-white rounded-full bg-black hover:bg-black/85 transition-all duration-300">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-normal text-black/60 hover:text-black transition-colors duration-200">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/rectify" onClick={() => setIsOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-medium text-white rounded-full bg-black hover:bg-black/85 transition-all duration-300">
                      Start Analysis
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
