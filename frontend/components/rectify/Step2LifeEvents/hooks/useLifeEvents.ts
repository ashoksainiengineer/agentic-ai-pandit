import { useState, useCallback, useMemo } from 'react';
import { LifeEvent } from '@/lib/types';
import { EventCategory, EventTemplate, EventImportance } from '@/lib/events/types';
import { EVENT_CATEGORIES as ENHANCED_CATEGORIES } from '@/lib/events/categories';
import { getCategoryById } from '@/lib/events/utils';
import { Step2Props, DatePrecision, ImportanceLevel } from '../types';
import { generateEventId, sanitizeDescription, parseDateParts, isValidDateString } from '../utils';

export function useLifeEvents({ lifeEvents, updateEvents }: Step2Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customCategories, setCustomCategories] = useState<EventCategory[]>([]);
    const [preselectedCategoryId, setPreselectedCategoryId] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Combine default and custom categories
    const allCategories = useMemo(() => {
        return [...ENHANCED_CATEGORIES, ...customCategories];
    }, [customCategories]);

    // God-tier accuracy calculation
    const accuracy = useMemo(() => {
        const validEvents = lifeEvents.filter((e: LifeEvent) =>
            e.description &&
            e.description.trim().length >= 10 &&
            e.eventDate &&
            isValidDateString(e.eventDate)
        );

        const eventCount = validEvents.length;
        const categoriesCount = new Set(validEvents.map((e: LifeEvent) => e.category)).size;

        // Base score from events (max 45 points at 30 events)
        const eventScore = Math.min(45, eventCount * 1.5);

        // Category diversity bonus (max 20 points at 10 categories)
        const categoryScore = Math.min(20, categoriesCount * 2);

        // Precision bonus for exact dates (max 15 points)
        const exactDateCount = validEvents.filter((e: LifeEvent) =>
            (e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time')
        ).length;
        const precisionScore = Math.min(15, exactDateCount * 1.5);

        // Life span coverage (max 10 points)
        const decades = new Set(validEvents.map((e: LifeEvent) => {
            const year = parseDateParts(e.eventDate).year;
            return year ? Math.floor(parseInt(year, 10) / 10) : null;
        }).filter(Boolean)).size;
        const spanScore = Math.min(10, decades * 3);

        // Critical categories bonus (max 10 points)
        const criticalCategories = ['career', 'marriage', 'health'];
        const hasCritical = criticalCategories.filter(cat =>
            validEvents.some((e: LifeEvent) => e.category === cat)
        ).length;
        const criticalScore = hasCritical * 3;

        const totalAccuracy = Math.min(99, 20 + eventScore + categoryScore + precisionScore + spanScore + criticalScore);
        return Math.round(totalAccuracy);
    }, [lifeEvents]);

    // Validate event before adding
    const validateEvent = (event: LifeEvent): boolean => {
        const newErrors: Record<string, string> = {};

        if (!event.eventType?.trim()) {
            newErrors.eventType = 'Event type is required';
        }

        if (event.description && event.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addEvent = useCallback((label: string, icon: string, category: string, importance: ImportanceLevel = 'medium', isCustom = false) => {
        const categoryData = getCategoryById(allCategories, category);
        const newEvent: LifeEvent = {
            id: generateEventId(),
            category: category,
            eventType: label,
            icon: icon || categoryData?.icon || '📅',
            datePrecision: 'month_year',
            eventDate: '',
            description: '',
            importance,
            isCustom
        };

        if (validateEvent(newEvent)) {
            updateEvents([...lifeEvents, newEvent]);
            setEditingId(newEvent.id);
            setErrors({});
        }
    }, [lifeEvents, updateEvents, allCategories]);

    const addLifeEventToTimeline = useCallback((event: EventTemplate, categoryId: string) => {
        const category = getCategoryById(allCategories, categoryId);
        addEvent(event.label, category?.icon || '📅', categoryId, event.importance as ImportanceLevel);
    }, [addEvent, allCategories]);

    const createCustomLifeEvent = useCallback((data: {
        label: string;
        categoryId: string;
        importance: EventImportance;
        isNewCategory: boolean;
        newCategoryName?: string;
    }) => {
        if (data.isNewCategory && data.newCategoryName) {
            // Create new category
            const newCategory: EventCategory = {
                id: `custom_${crypto.randomUUID()}`,
                icon: '📌',
                label: data.newCategoryName,
                color: '#000000',
                description: `Custom category: ${data.newCategoryName}`,
                events: [],
                isCustom: true
            };
            setCustomCategories(prev => [...prev, newCategory]);
            addEvent(data.label, newCategory.icon, newCategory.id, data.importance as ImportanceLevel, true);
        } else {
            const existingCategory = getCategoryById(allCategories, data.categoryId);
            addEvent(data.label, existingCategory?.icon || '📅', data.categoryId, data.importance as ImportanceLevel, true);
        }
        setIsCustomModalOpen(false);
    }, [addEvent, allCategories]);

    // Update event with proper state handling
    const updateEvent = useCallback((id: string, updates: Partial<LifeEvent>) => {
        if (updates.description !== undefined) {
            updates.description = sanitizeDescription(updates.description);
        }
        const updatedEvents = lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e);
        updateEvents(updatedEvents);
    }, [lifeEvents, updateEvents]);

    // Handle precision change - intelligently preserve date values when possible
    const updateEventDatePrecision = useCallback((id: string, newPrecision: DatePrecision) => {
        const event = lifeEvents.find(e => e.id === id);
        if (!event) return;

        const updates: Partial<LifeEvent> = { datePrecision: newPrecision };
        const oldPrecision = event.datePrecision as DatePrecision;

        if (newPrecision !== 'exact_date_time' && event.eventTime) {
            updates.eventTime = undefined;
        }

        if (!newPrecision.includes('range') && event.endDate) {
            updates.endDate = undefined;
        }

        if (oldPrecision !== newPrecision) {
            const { year, month } = parseDateParts(event.eventDate);

            const precisionLevels: Record<DatePrecision, number> = {
                'exact_date_time': 5,
                'exact_date': 4,
                'date_range': 4,
                'month_year': 2,
                'month_range': 2,
                'year_range': 1
            };

            const oldLevel = precisionLevels[oldPrecision] || 0;
            const newLevel = precisionLevels[newPrecision] || 0;

            if (newLevel < oldLevel) {
                if (newPrecision === 'year_range') {
                    updates.eventDate = year || '';
                    updates.endDate = year || '';
                } else if (newPrecision === 'month_year' || newPrecision === 'month_range') {
                    if (year && month) {
                        updates.eventDate = `${year}-${month.padStart(2, '0')}`;
                    } else {
                        updates.eventDate = year || '';
                    }
                    if (newPrecision === 'month_range') {
                        updates.endDate = updates.eventDate;
                    }
                }
            }
        }

        updateEvent(id, updates);
    }, [lifeEvents, updateEvent]);

    const deleteEvent = useCallback((id: string) => {
        const updatedEvents = lifeEvents.filter(e => e.id !== id);
        updateEvents(updatedEvents);
        setEditingId(null);
        setErrors({});
    }, [updateEvents, lifeEvents]);

    // Memoized sorted events
    const sortedEvents = useMemo(() => {
        return [...lifeEvents].sort((a, b) => {
            if (!a.eventDate || !isValidDateString(a.eventDate)) return 1;
            if (!b.eventDate || !isValidDateString(b.eventDate)) return -1;
            return a.eventDate.localeCompare(b.eventDate);
        });
    }, [lifeEvents]);

    const editingEvent = editingId ? lifeEvents.find(e => e.id === editingId) : null;

    const editingEventData = useMemo(() => {
        if (!editingEvent) return null;
        return {
            id: editingEvent.eventType,
            label: editingEvent.eventType,
            description: editingEvent.description,
            importance: editingEvent.importance || 'medium',
            categoryId: editingEvent.category,
            isCustom: editingEvent.isCustom
        };
    }, [editingEvent]);

    return {
        editingId,
        setEditingId,
        isCustomModalOpen,
        setIsCustomModalOpen,
        customCategories,
        preselectedCategoryId,
        setPreselectedCategoryId,
        errors,
        setErrors,
        allCategories,
        accuracy,
        addLifeEventToTimeline,
        createCustomLifeEvent,
        updateEvent,
        updateEventDatePrecision,
        deleteEvent,
        sortedEvents,
        editingEvent,
        editingEventData
    };
}
