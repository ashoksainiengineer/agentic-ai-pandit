'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import '@/app/prism-design-system.css';

interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function CTASection({
  title,
  subtitle,
  ctaLabel = 'Get Started',
  ctaHref = '#',
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden prism-section-lg">
      {/* Subtle spectrum gradient glow background */}
      <div
        className="absolute inset-0 prism-gradient-spectrum opacity-[0.08] blur-[120px] scale-110"
        aria-hidden="true"
      />

      <div className="prism-container relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink"
          >
            {title}
          </motion.h2>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="mt-4 text-lg font-normal text-prism-graphite"
            >
              {subtitle}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mt-10"
          >
            <Link href={ctaHref}>
              <button type="button" className="prism-btn">
                {ctaLabel}
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
