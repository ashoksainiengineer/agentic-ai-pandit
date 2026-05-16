/**
 * AI Pandit - Footer Component
 * Light Theme
 */

'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { href: '/rectify', label: 'Start Analysis' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/#how-it-works', label: 'How It Works' },
  ],
  Company: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

const socialLinks = [
  { label: 'Email', href: 'mailto:app.aipandit@gmail.com', icon: Mail },
];

export default memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-black/[0.05]">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl font-medium leading-none">ॐ</span>
              </div>
              <span className="text-2xl font-medium text-black tracking-tight">AI Pandit</span>
            </Link>
            <p className="text-[#636363] text-sm leading-relaxed max-w-xs mb-8">
              AI-powered Vedic birth time rectification with seconds-level precision.
              Private by design.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/10 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-black/40 hover:text-black/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 pt-8 mt-16 flex items-center justify-center">
          <p className="text-xs text-black/30">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});
