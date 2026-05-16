'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-prism-2 text-sm font-prism font-medium text-prism-graphite">
          {label}
        </label>
      )}
      <input
        disabled={disabled}
        className={cn(
          'w-full bg-white/90 backdrop-blur-prism-lg',
          'border border-prism-pebble rounded-prism-lg',
          'px-prism-6 py-prism-5',
          'font-prism text-base font-normal text-prism-ink',
          'placeholder:text-prism-slate',
          'transition-all duration-200 ease-in-out',
          'focus:border-prism-ink focus:outline-none',
          'focus:ring-[3px] focus:ring-black/[0.04]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error && 'border-prism-crimson focus:border-prism-crimson',
          className
        )}
        style={{
          WebkitBackdropFilter: 'blur(24px)',
        }}
        {...props}
      />
      {error && (
        <p className="mt-prism-2 text-sm text-prism-crimson font-prism">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-prism-2 text-sm text-prism-slate font-prism">
          {helperText}
        </p>
      )}
    </div>
  );
}
