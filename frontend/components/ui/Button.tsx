'use client';

import React from 'react';
import '@/app/globals.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-prism-ink text-prism-snow hover:bg-prism-graphite active:scale-[0.98]',
  secondary:
    'border border-prism-pebble text-prism-ink hover:bg-prism-fog active:bg-prism-pebble/30',
  ghost:
    'text-prism-graphite hover:bg-prism-fog hover:text-prism-ink',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-prism-sm',
  md: 'px-6 py-3 text-sm font-medium rounded-prism-xl',
  lg: 'px-8 py-4 text-base font-medium rounded-prism-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 font-prism ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
