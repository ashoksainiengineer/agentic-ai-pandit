'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function WhyEventsScience() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h4 className="font-medium text-content-primary text-sm flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        The Mathematics of BTR
      </h4>

      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary-dark/5 rounded-xl border border-primary/20">
        <h5 className="font-medium text-content-primary mb-2">Why 30+ Events?</h5>
        <p className="text-sm text-content-secondary leading-relaxed">
          Each life event is triggered by specific planetary periods (Dasha).
          With only 5-7 events, we have limited data points to cross-reference.
          With 30+ events spanning multiple decades, we create a
          <span className="font-medium text-primary"> redundant verification matrix</span>
          that can pinpoint birth time to the second.
        </p>
      </div>

      <div className="space-y-3">
        <h5 className="font-medium text-sm text-content-primary">How Events Validate Birth Time:</h5>

        <div className="space-y-2">
          {[
            {
              title: 'Dasha Overlap Verification',
              desc: 'Multiple events should align with the same planetary periods. If 15 events all point to Jupiter-Venus period, we confirm timing.',
            },
            {
              title: 'Multi-House Validation',
              desc: 'Career events validate 10th house, Marriage validates 7th house, Health validates 6th/8th houses. All houses must align.',
            },
            {
              title: 'Transit Cross-Reference',
              desc: 'Jupiter transits (12 years), Saturn (30 years), Rahu (18 years) must ALL align with event dates for the calculated birth time.',
            },
            {
              title: 'Statistical Confidence',
              desc: 'With 5 events, coincidence is possible. With 30+ events across different categories, statistical confidence reaches 99%+.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-surface-muted">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-sm text-content-primary">{item.title}</div>
                <p className="text-xs text-content-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
