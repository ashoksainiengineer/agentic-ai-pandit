import React from 'react';
import '@/app/prism-design-system.css';
import { cn } from './cn';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'lg';
  frosted?: boolean;
}

/**
 * Page section wrapper for the Prism design system.
 * Applies consistent vertical spacing and optional frosted glass background.
 */
export default function Section({
  children,
  className,
  size = 'default',
  frosted = false,
}: SectionProps) {
  return (
    <section
      className={cn(
        size === 'lg' ? 'py-prism-14' : 'py-prism-12',
        frosted && 'bg-prism-canvas',
        className
      )}
    >
      {children}
    </section>
  );
}
