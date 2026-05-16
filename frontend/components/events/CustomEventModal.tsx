/**
 * CustomEventModal Component
 * Modal for creating custom events and categories
 * Note: Importance is selected later when user enters time/date
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { EventCategory, EventImportance } from '@/lib/events/types';
import { validateCustomEvent } from '@/lib/events/utils';

interface CustomEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: EventCategory[];
  preselectedCategoryId?: string;
  onCreateEvent: (event: {
    label: string;
    categoryId: string;
    importance: EventImportance;
    isNewCategory: boolean;
    newCategoryName?: string;
  }) => void;
}

export default function CustomEventModal({
  isOpen,
  onClose,
  categories,
  preselectedCategoryId,
  onCreateEvent,
}: CustomEventModalProps) {
  const [eventName, setEventName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set preselected category when modal opens
  useEffect(() => {
    if (isOpen && preselectedCategoryId) {
      setSelectedCategory(preselectedCategoryId);
      setIsCreatingCategory(false);
    }
    // Reset when modal closes
    if (!isOpen) {
      setSelectedCategory('');
      setIsCreatingCategory(false);
    }
  }, [isOpen, preselectedCategoryId]);

  const resetForm = useCallback(() => {
    setEventName('');
    setSelectedCategory('');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validate event name
      const categoryId = isCreatingCategory ? 'custom' : selectedCategory;
      const validation = validateCustomEvent(eventName, categoryId);

      if (!validation.valid) {
        setError(validation.error || 'Invalid input');
        return;
      }

      // Validate new category if creating
      if (isCreatingCategory) {
        if (!newCategoryName.trim() || newCategoryName.length < 2) {
          setError('Category name must be at least 2 characters');
          return;
        }
      }

      setIsSubmitting(true);

      try {
        onCreateEvent({
          label: eventName.trim(),
          categoryId: isCreatingCategory ? 'custom' : selectedCategory,
          importance: 'medium',
          isNewCategory: isCreatingCategory,
          newCategoryName: isCreatingCategory ? newCategoryName.trim() : undefined,
        });

        handleClose();
      } catch {
        setError('Failed to create event. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      eventName,
      selectedCategory,
      isCreatingCategory,
      newCategoryName,
      onCreateEvent,
      handleClose,
    ]
  );

  const emojiOptions = [
    '📌', '💫', '✨', '🌟', '⭐', '🔥', '❤️', '💙', '💚', '💛', '💜', '🧡',
    '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
    '🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌼', '🍀', '🌿', '🌱', '🌲', '🌳',
    '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🐊', '🐉',
    '🔮', '💎', '💍', '👑', '🎩', '👒', '🎓', '👔', '👗', '👘', '👠', '👟',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Modal - Perfect Size */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header - Compact */}
            <div className="p-4 border-b border-[#E8E0D5] flex items-center justify-between bg-gradient-to-r from-[#ffffff] to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#000000]/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h2 className="font-medium text-black text-base">Create Custom Event</h2>
                  <p className="text-xs text-[#636363]">
                    Add custom life events
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-[var(--prism-canvas)] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#636363]" />
              </button>
            </div>

            {/* Form - Compact spacing */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#C65D3B]/10 border border-[#C65D3B]/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-[#C65D3B] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#C65D3B]">{error}</p>
                </motion.div>
              )}

              {/* Event Name - Compact */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black">
                  Event Name <span className="text-[#C65D3B]">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Started Learning Guitar"
                  className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-black placeholder-[#959595] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-[#636363]">
                  Clear description helps BTR accuracy
                </p>
              </div>

              {/* Category Selection - Compact */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-black">
                    Category <span className="text-[#C65D3B]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs text-black hover:underline flex items-center gap-1"
                  >
                    {isCreatingCategory ? (
                      '← Select Existing'
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Create New Category
                      </>
                    )}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="space-y-2 p-3 bg-[var(--prism-canvas)] rounded-xl">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (e.g., Hobbies)"
                      className="w-full h-9 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-black placeholder-[#959595] focus:border-[#000000] outline-none"
                    />
                    <div>
                      <label className="text-xs text-[#636363] mb-1.5 block">
                        Choose Icon
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewCategoryIcon(emoji)}
                            className={`w-8 h-8 text-lg rounded-md transition-all ${newCategoryIcon === emoji
                              ? 'bg-[#000000] text-white'
                              : 'bg-white hover:bg-[#E8E0D5]'
                              }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-black focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tips - Compact */}
              <div className="p-3 bg-[#184131]/5 border border-[#184131]/20 rounded-lg">
                <p className="text-xs text-[#184131]">
                  <strong>💡</strong> Set event importance after adding time &amp; date
                </p>
              </div>
            </form>

            {/* Footer - Compact */}
            <div className="p-4 border-t border-[#E8E0D5] bg-[#ffffff] flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-10 border-2 border-[#E8E0D5] text-[#636363] font-medium rounded-lg hover:border-[#000000]/30 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !eventName.trim() ||
                  (!isCreatingCategory && !selectedCategory) ||
                  (isCreatingCategory && !newCategoryName.trim())
                }
                className="flex-1 h-10 bg-black text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
