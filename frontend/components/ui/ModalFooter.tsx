'use client';

import React from 'react';
import '@/app/globals.css';

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export default function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`p-4 border-t border-prism-pebble bg-prism-fog flex gap-3 ${className}`}>
      {children}
    </div>
  );
}
