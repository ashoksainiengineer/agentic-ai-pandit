'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { CATEGORY_IMPORTANCE } from './why-events-data';

export default function WhyEventsCategories() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <h4 className="font-medium text-content-primary text-sm flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Essential Life Categories
      </h4>
      <p className="text-xs text-content-secondary">
        Each category validates different astrological houses and planetary periods
      </p>

      <div className="space-y-3">
        {CATEGORY_IMPORTANCE.map((cat, idx) => (
          <div key={idx} className="p-3 bg-white rounded-xl border border-surface-muted">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <cat.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm text-content-primary">{cat.category}</h5>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {cat.events}
                  </span>
                </div>
                <p className="text-xs text-content-secondary mt-1">{cat.why}</p>
                <p className="text-[10px] text-trust mt-1">Planets: {cat.planets}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {cat.examples.map((ex, i) => (
                    <span key={i} className="text-[10px] bg-surface-elevated text-content-secondary px-2 py-0.5 rounded">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
