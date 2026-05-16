'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/app/prism-design-system.css';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop blur overlay */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ WebkitBackdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-white/90 backdrop-blur-prism-lg',
              'rounded-prism-xl shadow-prism-sm',
              'overflow-hidden',
              SIZE_CLASSES[size],
              className
            )}
            style={{ WebkitBackdropFilter: 'blur(24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-prism-8 pt-prism-8 pb-prism-4">
                <h2 className="font-prism text-lg font-medium text-prism-ink">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'w-8 h-8 rounded-full',
                    'text-prism-graphite hover:text-prism-ink hover:bg-prism-fog',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-prism-pebble'
                  )}
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Close button (when no title) */}
            {!title && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'absolute top-prism-6 right-prism-6',
                  'inline-flex items-center justify-center',
                  'w-8 h-8 rounded-full',
                  'text-prism-graphite hover:text-prism-ink hover:bg-prism-fog',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-prism-pebble',
                  'z-10'
                )}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Content */}
            <div className={cn('px-prism-8', title ? 'pb-prism-8' : 'py-prism-8')}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
