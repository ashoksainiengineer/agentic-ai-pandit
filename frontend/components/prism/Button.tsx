'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

type ButtonVariant = 'filled' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled:
    'bg-prism-pebble text-black/85 hover:bg-prism-ink hover:text-prism-snow rounded-prism-xl',
  ghost:
    'bg-transparent text-black/85 hover:bg-prism-fog border border-transparent hover:border-prism-pebble rounded-full',
  soft:
    'bg-black/[0.04] text-black/85 hover:bg-black/[0.08] rounded-prism-md',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-prism-5 py-prism-3 text-sm',
  md: 'px-prism-7 py-prism-5 text-sm',
  lg: 'px-prism-8 py-prism-6 text-base',
};

export default function Button({
  variant = 'filled',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-prism-3 font-prism font-medium',
        'transition-all duration-200 ease-in-out',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
