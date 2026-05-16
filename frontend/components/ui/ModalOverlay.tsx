'use client';

import React from 'react';
import { motion } from 'framer-motion';
import '@/app/prism-design-system.css';

interface ModalOverlayProps {
  onClose?: () => void;
  children: React.ReactNode;
}

export default function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-prism-ink/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </motion.div>
  );
}
