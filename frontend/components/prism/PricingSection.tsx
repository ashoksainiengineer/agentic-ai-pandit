'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
  ctaLabel?: string;
}

interface PricingSectionProps {
  title: string;
  subtitle?: string;
  plans: PricingPlan[];
}

export default function PricingSection({
  title,
  subtitle,
  plans,
}: PricingSectionProps) {
  return (
    <section className="prism-section">
      <div className="prism-container">
        {/* Section Header */}
        <div className="text-center mb-prism-10">
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
              className="mt-4 text-lg font-normal text-prism-graphite max-w-2xl mx-auto"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-prism-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                delay: index * 0.08,
              }}
              className={cn(
                'relative rounded-prism-xl p-[2px]',
                plan.featured && 'prism-gradient-spectrum'
              )}
            >
              <div
                className={cn(
                  'h-full rounded-prism-xl bg-white/90 backdrop-blur-prism-lg',
                  'shadow-prism-sm p-prism-8 flex flex-col',
                  !plan.featured && 'border border-prism-pebble'
                )}
                style={{
                  WebkitBackdropFilter: 'blur(24px)',
                }}
              >
                {/* Plan Name */}
                <p className="font-prism text-sm font-medium text-prism-graphite uppercase tracking-wide">
                  {plan.name}
                </p>

                {/* Price */}
                <div className="mt-prism-6 flex items-baseline gap-1">
                  <span className="font-prism font-light text-[3.375rem] leading-none tracking-[-0.02em] text-prism-ink">
                    {plan.price}
                  </span>
                  <span className="font-prism text-sm font-normal text-prism-slate">
                    {plan.period}
                  </span>
                </div>

                {/* Divider */}
                <div className="my-prism-8 h-px bg-prism-fog" />

                {/* Features */}
                <ul className="flex-1 space-y-prism-4 mb-prism-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-prism-3"
                    >
                      <Check
                        className="w-4 h-4 text-prism-graphite mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-prism text-sm font-normal text-prism-ink leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button type="button" className="prism-btn w-full">
                  {plan.ctaLabel ?? 'Choose Plan'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
