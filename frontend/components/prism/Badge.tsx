'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

type BadgeVariant = 'neutral' | 'spectrum' | 'dark';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-prism-fog text-prism-graphite',
  spectrum:
    'bg-gradient-to-r from-prism-rose-quartz via-prism-crimson to-prism-marigold text-prism-snow',
  dark: 'bg-prism-ink text-prism-snow',
};

export default function Badge({
  variant = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-prism-2',
        'px-prism-4 py-prism-2',
        'rounded-full',
        'font-prism text-[0.625rem] font-medium leading-none',
        'tracking-[0.02em] uppercase',
        'whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
