/**
 * Form Component Types
 * Shared type definitions for form components
 */

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export interface FormSectionProps {
  title: string;
  children: ReactNode;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export interface FormCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'subtle';
}

export interface FormHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  icon?: ReactNode;
}

export interface FormTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  rows?: number;
}

export interface FormRadioGroupProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string; icon?: ReactNode }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export interface FormDatePickerProps {
  label: string;
  day: string;
  month: string;
  year: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  error?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
}

export interface FormTimePickerProps {
  label: string;
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
  onPeriodChange: (value: 'AM' | 'PM') => void;
  error?: string;
  required?: boolean;
}

export interface FormToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  error?: string;
}
