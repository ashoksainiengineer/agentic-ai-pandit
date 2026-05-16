/**
 * EventSelector Component
 * Smart event suggestions with category browsing and search
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ChevronDown, AlertTriangle } from 'lucide-react';
import { EventTemplate, EventImportance } from '@/lib/events/types';
import {
  filterEvents,
  searchEvents,
  getImportanceLabel,
  getDefaultCategories,
} from '@/lib/events/utils';
import { EVENT_CATEGORIES } from '@/lib/events/categories';

interface EventSelectorProps {
  existingEvents: Array<{ eventType: string }>;
  onSelectEvent: (event: EventTemplate, categoryId: string) => void;
  onCreateCustom: (categoryId?: string) => void;
}

export default function EventSelector({
  existingEvents,
  onSelectEvent,
  onCreateCustom,
}: EventSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [importanceFilter, setImportanceFilter] = useState<EventImportance[]>([]);

  // Show all categories without age/gender filtering
  const filteredCategories = useMemo(() => {
    const categories = showSensitive
      ? EVENT_CATEGORIES
      : getDefaultCategories(EVENT_CATEGORIES);

    // Only filter by importance and search, NOT by age/gender
    return filterEvents(categories, {
      importance: importanceFilter.length > 0 ? importanceFilter : undefined,
      searchQuery: searchQuery || undefined,
    });
  }, [importanceFilter, searchQuery, showSensitive]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchEvents(EVENT_CATEGORIES, searchQuery);
  }, [searchQuery]);

  const handleEventClick = useCallback(
    (event: EventTemplate, categoryId: string) => {
      onSelectEvent(event, categoryId);
    },
    [onSelectEvent]
  );

  const isEventAdded = useCallback(
    (eventLabel: string) => {
      return existingEvents.some(
        (e) => e.eventType.toLowerCase() === eventLabel.toLowerCase()
      );
    },
    [existingEvents]
  );

  const toggleImportance = useCallback((importance: EventImportance) => {
    setImportanceFilter((prev) =>
      prev.includes(importance)
        ? prev.filter((i) => i !== importance)
        : [...prev, importance]
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#959595]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search life events... (e.g., marriage, surgery, school)"
          className="w-full h-12 pl-12 pr-4 bg-white border border-[#E8E0D5] rounded-xl text-black placeholder-[#959595] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#959595] hover:text-[#636363]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden"
        >
          <div className="p-3 bg-[var(--prism-canvas)] border-b border-[#E8E0D5] text-xs text-[#636363]">
            Found {searchResults.length} results for &quot;{searchQuery}&quot;
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchResults.map((event) => {
              const added = isEventAdded(event.label);
              return (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event, event.categoryId)}
                  disabled={added}
                  className={`w-full text-left px-4 py-3 border-b border-[rgba(0,0,0,0.08)] last:border-0 transition-colors ${added
                      ? 'bg-[#184131]/5 text-[#184131]'
                      : 'hover:bg-[var(--prism-canvas)]'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-black">
                        {added && <span className="mr-1">✓</span>}
                        {event.label}
                      </div>
                      <div className="text-xs text-[#636363]">
                        {event.categoryLabel} • {getImportanceLabel(event.importance)}
                      </div>
                    </div>
                    {!added && (
                      <Plus className="w-5 h-5 text-black" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Importance Filter */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2">
          {(['critical', 'high', 'medium', 'low'] as EventImportance[]).map(
            (importance) => (
              <button
                key={importance}
                onClick={() => toggleImportance(importance)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${importanceFilter.includes(importance)
                    ? 'bg-[#000000] text-white'
                    : 'bg-[var(--prism-canvas)] text-[#636363] hover:bg-[#E8E0D5]'
                  }`}
              >
                {getImportanceLabel(importance)}
              </button>
            )
          )}
          {importanceFilter.length > 0 && (
            <button
              onClick={() => setImportanceFilter([])}
              className="px-3 py-1.5 text-xs text-[#C65D3B] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Category Browser */}
      {!searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-black">
              Browse by Category
            </h3>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${showSensitive
                  ? 'bg-[#DC143C]/10 text-[#DC143C]'
                  : 'bg-[var(--prism-canvas)] text-[#636363] hover:bg-[#E8E0D5]'
                }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredCategories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-left transition-all border ${selectedCategory === category.id
                    ? 'bg-[#000000] text-white border-[#000000] shadow-md'
                    : category.isSensitive
                      ? 'bg-[#DC143C]/5 text-[#636363] border-[#DC143C]/20 hover:bg-[#DC143C]/10'
                      : 'bg-white text-[#636363] border-[#E8E0D5] hover:border-[#000000]/30 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{category.icon}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === category.id
                        ? 'bg-white/20'
                        : 'bg-[var(--prism-canvas)] text-[#636363]'
                      }`}
                  >
                    {category.events.length}
                  </span>
                </div>
                <div className="mt-2 font-medium text-sm">{category.label}</div>
                <div
                  className={`text-xs mt-1 ${selectedCategory === category.id
                      ? 'text-white/80'
                      : 'text-[#636363]'
                    }`}
                >
                  {category.events.slice(0, 3).map((e) => e.label.split(' ')[0]).join(', ')}
                  {category.events.length > 3 && '...'}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Category Events */}
      <AnimatePresence>
        {selectedCategory && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden"
          >
            {filteredCategories
              .filter((cat) => cat.id === selectedCategory)
              .map((category) => (
                <div key={category.id}>
                  <div className="p-4 bg-[var(--prism-canvas)] border-b border-[#E8E0D5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <div>
                        <div className="font-medium text-black">
                          {category.label}
                        </div>
                        <div className="text-xs text-[#636363]">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-[#636363] hover:text-[#636363]"
                    >
                      <ChevronDown className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {category.events.map((event) => {
                        const added = isEventAdded(event.label);
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event, category.id)}
                            disabled={added}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${added
                                ? 'bg-[#184131]/10 text-[#184131] cursor-default'
                                : 'bg-[var(--prism-canvas)] text-[#636363] hover:bg-[#000000]/10 hover:text-black border border-transparent hover:border-[#000000]/30'
                              }`}
                          >
                            {added && <span className="mr-1">✓</span>}
                            {event.label}
                            <span
                              className={`ml-2 text-xs ${added ? 'text-[#184131]' : 'text-[#959595]'
                                }`}
                            >
                              {event.importance === 'critical' && '⚡'}
                            </span>
                          </button>
                        );
                      })}
                      {/* Custom Event Button within Category */}
                      <button
                        onClick={() => onCreateCustom(category.id)}
                        className="px-3 py-2 rounded-lg text-sm bg-white text-black border-2 border-dashed border-[#000000]/30 hover:bg-[#000000]/5 hover:border-[#000000]/50 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Custom
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Event Button */}
      <button
        onClick={() => onCreateCustom()}
        className="w-full h-14 border-2 border-dashed border-[#000000]/30 rounded-xl text-black font-medium hover:bg-[#000000]/5 hover:border-[#000000]/50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create Custom Event
      </button>
    </div>
  );
}
