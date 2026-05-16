/**
 * Delete Confirmation Modal - Sacred Ivory Light Theme
 * Shows what data will be deleted with elegant design
 */

'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2, User, FileText, Sparkles, Database } from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: DashboardSession;
  isDeleting?: boolean;
  error?: string | null;
}

export const DeleteConfirmModal = memo(function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  isDeleting = false,
  error,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const isCompleted = session.status === 'complete';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#000000] via-[#000000] to-[#000000]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-2 rounded-full text-[#959595] hover:text-[#636363] hover:bg-[var(--prism-canvas)] transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-medium text-black text-center  mb-1">
              Delete {isCompleted ? 'Analysis' : 'Draft'}?
            </h3>

            {/* Subtitle */}
            <p className="text-[#636363] text-center text-sm mb-6">
              This will permanently remove <span className="font-medium text-black">{session.fullName}&apos;s</span> data
            </p>

            {/* Data Categories Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Personal Data */}
              <div className="p-3 bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-black text-sm">Birth Details</span>
                </div>
                <ul className="text-xs text-[#636363] space-y-1 ml-10">
                  <li>• {session.fullName}</li>
                  <li>• {session.dateOfBirth}</li>
                  <li>• {session.tentativeTime || 'Not set'}</li>
                  <li>• {session.birthPlace}</li>
                </ul>
              </div>

              {/* Form Progress */}
              <div className="p-3 bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-black text-sm">Form Data</span>
                </div>
                <ul className="text-xs text-[#636363] space-y-1 ml-10">
                  <li>• Physical Traits</li>
                  <li>• Birth Profile Data</li>
                  <li>• Life Events</li>
                  <li>• All progress</li>
                </ul>
              </div>

              {/* Analysis Results (only for completed) */}
              {isCompleted && (
                <>
                  <div className="p-3 bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-black text-sm">Results</span>
                    </div>
                    <ul className="text-xs text-[#636363] space-y-1 ml-10">
                      <li>• Rectified Time</li>
                      <li>• {session.accuracy}% Accuracy</li>
                      <li>• Full Report</li>
                      <li>• Analysis Data</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Database className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-black text-sm">Technical</span>
                    </div>
                    <ul className="text-xs text-[#636363] space-y-1 ml-10">
                      <li>• Calculations</li>
                      <li>• Ephemeris Data</li>
                      <li>• Planet Positions</li>
                      <li>• House Placements</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Warning Banner */}
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">This action cannot be undone</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Once deleted, this data is permanently removed from our servers and cannot be recovered.
                </p>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black/30 flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-[11px] text-black/30">End-to-end encrypted</span>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-sm text-red-700 font-medium">Delete Failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-[#E8E0D5] text-[#636363] rounded-xl font-medium hover:bg-[var(--prism-canvas)] hover:text-[#636363] transition-all duration-200 disabled:opacity-50"
              >
                Keep {isCompleted ? 'Analysis' : 'Draft'}
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Decorative Corner */}
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-[#000000]">
              <circle cx="100" cy="100" r="80" />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
