'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
  hover?: boolean;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  sm: 'p-prism-6',
  md: 'p-prism-8',
  lg: 'p-prism-10',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/90 backdrop-blur-prism-lg rounded-prism-xl',
        'shadow-prism-sm border-none',
        'transition-all duration-200 ease-in-out',
        PADDING_CLASSES[padding],
        hover && 'hover:-translate-y-0.5 hover:shadow-prism-sm',
        className
      )}
      style={{
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {children}
    </div>
  );
}
