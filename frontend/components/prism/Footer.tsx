import React from 'react';
import Link from 'next/link';
import '@/app/prism-design-system.css';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface FooterProps {
  columns: FooterColumn[];
  copyright: string;
  socialLinks?: SocialLink[];
}

/**
 * Site footer for the Prism design system.
 * Multi-column link grid with a bottom copyright bar.
 */
export default function Footer({ columns, copyright, socialLinks }: FooterProps) {
  return (
    <footer className="bg-prism-canvas">
      <div className="w-full max-w-[1200px] mx-auto px-prism-7 py-prism-12">
        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-prism-8">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-prism-body-sm font-medium text-prism-ink mb-prism-6">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-prism-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-prism-body-sm font-normal text-prism-graphite transition-colors duration-200 hover:text-prism-ink hover:underline underline-offset-[0.15em] decoration-1"
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
        <div className="mt-prism-12 pt-prism-8 border-t border-prism-pebble flex flex-col sm:flex-row items-center justify-between gap-prism-6">
          <p className="text-prism-body-sm font-normal text-prism-slate">
            {copyright}
          </p>

          {socialLinks && socialLinks.length > 0 && (
            <div className="flex items-center gap-prism-6">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-prism-graphite transition-colors duration-200 hover:text-prism-ink"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
