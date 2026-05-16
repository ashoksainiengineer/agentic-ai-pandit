/**
 * FormError Component
 * Displays form validation errors
 */

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className={`text-[#D64545] text-xs mt-1.5 flex items-center gap-1 ${className}`}>
      <span>⚠</span>
      {message}
    </p>
  );
}
