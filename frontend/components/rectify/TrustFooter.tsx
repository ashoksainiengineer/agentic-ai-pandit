'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export default function TrustFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient top fade */}
      <div className="h-3 bg-gradient-to-t from-black/[0.05] to-transparent" />

      {/* Main bar - minimal single line */}
      <div className="bg-white/80 backdrop-blur-md border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6 py-2 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3 text-black/30 flex-shrink-0" />
          <span className="text-[11px] text-black/30 tracking-wide">
            Your data is encrypted and private
          </span>
        </div>
      </div>
    </div>
  );
}
