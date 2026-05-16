'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

interface PillProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Pill({
  active = false,
  children,
  onClick,
  className = '',
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-prism-3',
        'px-prism-6 py-prism-4',
        'rounded-full',
        'font-prism text-sm font-medium leading-relaxed',
        'whitespace-nowrap',
        'transition-all duration-200 ease-in-out',
        'cursor-pointer border-none',
        active
          ? 'text-prism-ink bg-prism-fog'
          : 'text-prism-steel bg-transparent hover:text-prism-graphite',
        className
      )}
    >
      {children}
    </button>
  );
}
