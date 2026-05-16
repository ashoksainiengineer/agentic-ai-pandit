'use client';

import { Lock } from 'lucide-react';

/**
 * Compact security badge — fit-to-text width, matches landing page box style.
 * Displayed above step indicators on both main flow and edit flow pages.
 */
export function SecurityBadge() {
  return (
    <div className="w-fit mx-auto mb-6">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-[#184131]/10 flex items-center justify-center flex-shrink-0">
          <Lock className="w-3.5 h-3.5 text-[#184131]" />
        </div>
        <p className="text-xs font-medium text-[#184131]">
          End-to-End Encrypted • AES-256-GCM
        </p>
      </div>
    </div>
  );
}
