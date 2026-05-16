/**
 * FormField Component
 * Sacred Ivory Light Theme - Wrapper for form inputs with label and error handling
 */

import { FormLabel } from './FormLabel';
import { FormError } from './FormError';
import { FormFieldProps } from './types';

export function FormField({
  label,
  children,
  error,
  required,
  description,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <FormLabel required={required}>{label}</FormLabel>
      {description && (
        <p className="text-xs text-[#636363] -mt-1 mb-2">{description}</p>
      )}
      {children}
      <FormError message={error} />
    </div>
  );
}
