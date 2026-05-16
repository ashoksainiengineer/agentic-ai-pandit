/**
 * FormLabel Component
 * Sacred Ivory Light Theme - Accessible label with required indicator
 */

import { ReactNode } from 'react';

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function FormLabel({ children, htmlFor, required, className = '' }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-[#636363] mb-2 ${className}`}
    >
      {children}
      {required && <span className="text-[#C65D3B] ml-1">*</span>}
    </label>
  );
}
