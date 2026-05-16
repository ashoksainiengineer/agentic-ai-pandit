import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import React from 'react';

export const statusConfig: Record<string, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  complete: {
    label: '✓ Verified',
    bgColor: 'bg-trust/10',
    textColor: 'text-trust',
    borderColor: 'border-trust/30',
    icon: React.createElement(CheckCircle2, { className: 'w-3.5 h-3.5' }),
  },
  processing: {
    label: 'Analyzing',
    bgColor: 'bg-primary-dark/10',
    textColor: 'text-primary',
    borderColor: 'border-primary-dark/30',
    icon: React.createElement(Loader2, { className: 'w-3.5 h-3.5 animate-spin' }),
  },
  pending: {
    label: 'Queued',
    bgColor: 'bg-trust/10',
    textColor: 'text-trust',
    borderColor: 'border-trust/30',
    icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }),
  },
  queued: {
    label: 'Queued',
    bgColor: 'bg-trust/10',
    textColor: 'text-trust',
    borderColor: 'border-trust/30',
    icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }),
  },
  retrying: {
    label: 'Retrying',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    icon: React.createElement(Loader2, { className: 'w-3.5 h-3.5 animate-spin' }),
  },
  draft: {
    label: 'Draft',
    bgColor: 'bg-trust/10',
    textColor: 'text-trust',
    borderColor: 'border-trust/30',
    icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }),
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    icon: React.createElement(AlertCircle, { className: 'w-3.5 h-3.5' }),
  },
};

export const confidenceConfig: Record<string, { color: string; label: string }> = {
  'god-tier': { color: '#000000', label: 'GOD-TIER' },
  'high': { color: '#184131', label: 'HIGH' },
  'medium': { color: '#000000', label: 'MEDIUM' },
  'low': { color: '#C65D3B', label: 'LOW' },
};
