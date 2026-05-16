'use client';

import React from 'react';
import { X } from 'lucide-react';
import '@/app/globals.css';

interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function ModalHeader({ title, subtitle, icon, onClose, className = '' }: ModalHeaderProps) {
  return (
    <div className={`p-4 border-b border-prism-pebble flex items-center justify-between bg-gradient-to-r from-prism-fog to-prism-snow ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 bg-prism-fog rounded-prism-lg flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          {title && <h2 className="font-medium text-prism-ink text-base font-prism">{title}</h2>}
          {subtitle && <p className="text-xs text-prism-graphite font-prism">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-prism-fog flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-prism-graphite" />
        </button>
      )}
    </div>
  );
}
