'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

interface HeroSectionProps {
  subtitle?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  showMockup?: boolean;
}

export default function HeroSection({
  subtitle,
  title,
  description,
  ctaLabel = 'Get Started',
  ctaHref = '#',
  showMockup = false,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="prism-container pt-prism-14 pb-prism-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-lg font-normal text-prism-graphite mb-6"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className={cn(
              'font-prism font-light text-prism-ink',
              'text-[2.25rem] leading-[1.11] tracking-[-0.04em]',
              'md:text-[4.5rem]'
            )}
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="mt-6 text-base font-normal text-prism-graphite leading-relaxed max-w-2xl mx-auto"
            >
              {description}
            </motion.p>
          )}

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            className="mt-10"
          >
            <Link href={ctaHref}>
              <button type="button" className="prism-btn">
                {ctaLabel}
              </button>
            </Link>
          </motion.div>

          {/* Mockup */}
          {showMockup && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
              className="mt-16 relative"
            >
              {/* Spectrum gradient glow behind */}
              <div
                className="absolute inset-0 prism-gradient-spectrum opacity-20 blur-3xl scale-95 translate-y-4"
                aria-hidden="true"
              />
              <div className="relative bg-prism-canvas border border-prism-pebble rounded-[0.625rem] overflow-hidden shadow-prism-sm aspect-[16/9]">
                <div className="absolute inset-0 flex items-center justify-center text-prism-slate text-sm">
                  Product Preview
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
