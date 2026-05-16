'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/app/globals.css';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';

export type ModalSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  maxHeight,
  className = '',
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay onClose={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${SIZE_CLASSES[size]} bg-prism-snow rounded-prism-xl shadow-prism-sm border border-prism-pebble overflow-hidden flex flex-col ${maxHeight ? maxHeight : ''} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-prism-ink via-prism-graphite to-prism-ink" />

            {(title || icon) && (
              <ModalHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                onClose={showCloseButton ? onClose : undefined}
              />
            )}

            <div className="overflow-y-auto flex-1">
              {children}
            </div>

            {footer && <ModalFooter>{footer}</ModalFooter>}
          </motion.div>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}

export { ModalOverlay, ModalHeader, ModalFooter };
