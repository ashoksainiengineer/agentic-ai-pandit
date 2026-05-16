'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tab: string;
}

interface FeaturesSectionProps {
  title: string;
  subtitle?: string;
  features: Feature[];
}

export default function FeaturesSection({
  title,
  subtitle,
  features,
}: FeaturesSectionProps) {
  const tabs = React.useMemo(
    () => Array.from(new Set(features.map((f) => f.tab))),
    [features]
  );
  const [activeTab, setActiveTab] = useState(tabs[0] ?? '');

  const filteredFeatures = React.useMemo(
    () => features.filter((f) => f.tab === activeTab),
    [features, activeTab]
  );

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

        {/* Tab Carousel */}
        {tabs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="flex gap-2 overflow-x-auto prism-scrollbar-hide justify-center mb-prism-10"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'prism-tab',
                  activeTab === tab && 'prism-tab-active'
                )}
              >
                {tab}
              </button>
            ))}
          </motion.div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-prism-6">
          {filteredFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={`${feature.tab}-${feature.title}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut',
                  delay: index * 0.05,
                }}
                className="prism-card"
              >
                <div className="w-10 h-10 rounded-prism-md bg-prism-fog flex items-center justify-center mb-prism-6">
                  <Icon className="w-5 h-5 text-prism-graphite" aria-hidden="true" />
                </div>
                <h3 className="font-prism text-base font-medium text-prism-ink mb-2">
                  {feature.title}
                </h3>
                <p className="font-prism text-sm font-normal text-prism-graphite leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
