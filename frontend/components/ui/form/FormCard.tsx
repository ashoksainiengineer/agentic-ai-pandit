/**
 * FormCard Component
 * Light Theme — Styled form container
 */

import { FormCardProps } from './types';

const variants = {
  default: 'bg-white border-[rgba(0,0,0,0.08)]',
  highlighted: 'bg-[#ffffff] border-[#000000]/30',
  subtle: 'bg-[var(--prism-canvas)] border-transparent',
};

export function FormCard({ children, className = '', variant = 'default' }: FormCardProps) {
  return (
    <div className={`rounded-2xl p-6 md:p-8 lg:p-10 border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
