import React from 'react';
import '@/app/prism-design-system.css';
import { cn } from './cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

/**
 * Max-width container for the Prism design system.
 * Centers content and applies consistent horizontal padding.
 */
export default function Container({
  children,
  className,
  fluid = false,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-prism-7',
        !fluid && 'max-w-[1200px] mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
