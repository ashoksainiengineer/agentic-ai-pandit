/**
 * DateInput Component
 * Production-grade date/time input for all 6 precision types
 *
 * Features:
 * - Comprehensive validation (leap years, days per month)
 * - Real-time error display
 * - Range validation (start <= end)
 * - Proper state management with synchronization fixes
 * - Clean separation of concerns
 *
 * Bug Fixes (2026-02-04):
 * - Fixed race conditions by separating state update from parent notification
 * - Fixed state sync loop using refs to track update source
 * - Fixed leading zero normalization for all dropdown values
 * - Fixed TimeSelect to use local state instead of props
 * - Added proper state persistence between re-renders
 */

'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  DatePrecision,
  DateParts,
  TimeParts,
  parseDateParts,
  parseTimeParts,
  validateDate,
  validateDateTime,
  validateMonthYear,
  validateDateRange,
  validateMonthRange,
  validateYearRange,
  buildDateString,
  buildTimeString,
  DATE_CONSTANTS
} from '@/lib/date-utils';

// Constants
const { MONTHS, HOURS, MINUTES } = DATE_CONSTANTS;

interface DateInputProps {
  precision: DatePrecision;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  onUpdate: (updates: {
    eventDate?: string;
    endDate?: string;
    eventTime?: string;
  }) => void;
  minYear?: number;
  maxYear?: number;
}

interface ValidationState {
  error: string | null;
  isValid: boolean;
}

/**
 * Helper to normalize month/day values (remove leading zeros)
 * This ensures dropdown values match option values
 */
const normalizeValue = (val: string): string => {
  if (!val) return '';
  // Remove leading zeros but keep the value
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? '' : parsed.toString();
};

const normalizeParts = (parts: DateParts): DateParts => ({
  year: parts.year,
  month: normalizeValue(parts.month),
  day: normalizeValue(parts.day)
});

/**
 * Year Select Component
 */
const YearSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  hasError?: boolean;
}> = ({ value, onChange, placeholder = 'Year', minYear, maxYear, hasError }) => {
  const years = useMemo(() => {
    const max = maxYear ?? new Date().getFullYear();
    const min = minYear ?? 1900;
    return Array.from({ length: max - min + 1 }, (_, i) => (max - i).toString());
  }, [minYear, maxYear]);

  // Normalize value to ensure it matches an option
  const normalizedValue = value ? parseInt(value, 10).toString() : '';

  return (
    <select
      value={normalizedValue}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all flex-1 min-w-0
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {years.map((year) => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  );
};

/**
 * Month Select Component
 * Values are 1-12 without leading zeros
 */
const MonthSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}> = ({ value, onChange, placeholder = 'Month', hasError }) => {
  // Normalize value to ensure it matches option values (1-12 without leading zeros)
  const normalizedValue = normalizeValue(value);

  return (
    <select
      value={normalizedValue}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all flex-1 min-w-0
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {MONTHS.map((month, index) => (
        <option key={month} value={(index + 1).toString()}>{month}</option>
      ))}
    </select>
  );
};

/**
 * Day Select Component
 * Dynamically shows correct number of days based on year/month
 * Values are 1-31 without leading zeros to match normalized state
 */
const DaySelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  year: string;
  month: string;
  placeholder?: string;
  hasError?: boolean;
}> = ({ value, onChange, year, month, placeholder = 'Day', hasError }) => {
  const days = useMemo(() => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    }
    const daysInMonth = getDaysInMonth(y, m);
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  }, [year, month]);

  // Normalize value to ensure it matches option values
  const normalizedValue = normalizeValue(value);

  return (
    <select
      value={normalizedValue}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {days.map((day) => (
        <option key={day} value={day}>{day}</option>
      ))}
    </select>
  );
};

// Helper function for days in month (needed for DaySelect)
function getDaysInMonth(year: number, month: number): number {
  if (isNaN(year) || isNaN(month)) return 31;
  if (month < 1 || month > 12) return 31;
  
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  if (isNaN(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Time Select Component
 * Uses normalized values without leading zeros for consistency
 */
const TimeSelect: React.FC<{
  hour: string;
  minute: string;
  onChange: (hour: string, minute: string) => void;
  hasError?: boolean;
}> = ({ hour, minute, onChange, hasError }) => {
  // Normalize values for select options
  const normalizedHour = normalizeValue(hour);
  const normalizedMinute = normalizeValue(minute);

  return (
    <div className="flex items-center gap-2">
      <select
        value={normalizedHour}
        onChange={(e) => onChange(e.target.value, minute)}
        className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
          ${hasError
            ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
            : 'border-[#E8E0D5] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10'
          }`}
      >
        <option value="">HH</option>
        {HOURS.map((h) => (
          <option key={h} value={parseInt(h, 10).toString()}>{h}</option>
        ))}
      </select>
      <span className="text-black font-medium">:</span>
      <select
        value={normalizedMinute}
        onChange={(e) => onChange(hour, e.target.value)}
        className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
          ${hasError
            ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
            : 'border-[#E8E0D5] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10'
          }`}
      >
        <option value="">MM</option>
        {MINUTES.map((m) => (
          <option key={m} value={parseInt(m, 10).toString()}>{m}</option>
        ))}
      </select>
    </div>
  );
};

/**
 * Error Display Component
 */
const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="flex items-center gap-2 text-[#C65D3B] text-xs mt-2 animate-in fade-in">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};

/**
 * Range Arrow Component
 */
const RangeArrow: React.FC = () => (
  <div className="flex items-center justify-center py-1">
    <span className="text-black text-xl">↓</span>
  </div>
);

/**
 * Main DateInput Component
 */
export default function DateInput({
  precision,
  eventDate,
  endDate,
  eventTime,
  onUpdate,
  minYear = 1900,
  maxYear = new Date().getFullYear()
}: DateInputProps) {
  // Ref to track if we're currently processing a user update
  // This prevents useEffect from overwriting user input
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LOCAL state for immediate dropdown updates (prevents lag from parent re-renders)
  const [localStartParts, setLocalStartParts] = useState<DateParts>({ year: '', month: '', day: '' });
  const [localEndParts, setLocalEndParts] = useState<DateParts>({ year: '', month: '', day: '' });
  const [localTimeParts, setLocalTimeParts] = useState<TimeParts>({ hour: '', minute: '' });

  // Sync local state with props when they change from parent
  // But NOT when user is actively updating (tracked by isUpdatingRef)
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const parts = normalizeParts(parseDateParts(eventDate));
    setLocalStartParts(prev => {
      // Only update if actually different to prevent loops
      if (prev.year !== parts.year || prev.month !== parts.month || prev.day !== parts.day) {
        return parts;
      }
      return prev;
    });
  }, [eventDate]);

  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const parts = normalizeParts(parseDateParts(endDate));
    setLocalEndParts(prev => {
      if (prev.year !== parts.year || prev.month !== parts.month || prev.day !== parts.day) {
        return parts;
      }
      return prev;
    });
  }, [endDate]);

  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const parts = parseTimeParts(eventTime);
    setLocalTimeParts(prev => {
      if (prev.hour !== parts.hour || prev.minute !== parts.minute) {
        return parts;
      }
      return prev;
    });
  }, [eventTime]);

  // Derived parts for validation (from props - always use the canonical values)
  const startParts = useMemo(() => parseDateParts(eventDate), [eventDate]);
  const endParts = useMemo(() => parseDateParts(endDate), [endDate]);
  


  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    error: null,
    isValid: true
  });

  /**
   * Perform comprehensive validation based on precision
   */
  const performValidation = useCallback(() => {
    let result: { valid: boolean; error?: string } = { valid: true };

    switch (precision) {
      case 'exact_date_time':
        if (eventDate && eventTime) result = validateDateTime(eventDate, eventTime);
        break;
      case 'exact_date':
        if (eventDate) result = validateDate(eventDate);
        break;
      case 'month_year':
        if (startParts.year && startParts.month) result = validateMonthYear(startParts.year, startParts.month);
        break;
      case 'date_range':
        if (eventDate && endDate) result = validateDateRange(eventDate, endDate);
        break;
      case 'month_range':
        if (startParts.year && startParts.month && endParts.year && endParts.month) {
          result = validateMonthRange(startParts.year, startParts.month, endParts.year, endParts.month);
        }
        break;
      case 'year_range':
        if (startParts.year && endParts.year) result = validateYearRange(startParts.year, endParts.year);
        break;
    default:
      break;
    }

    setValidation({
      error: result.error || null,
      isValid: result.valid
    });
  }, [precision, eventDate, endDate, eventTime, startParts.year, startParts.month, endParts.year, endParts.month]);

  // Validate on changes
  useEffect(() => {
    performValidation();
  }, [performValidation]);

  /**
   * Debounced parent update to batch rapid changes
   * and avoid race conditions
   */
  const debouncedOnUpdate = useCallback((updates: {
    eventDate?: string;
    endDate?: string;
    eventTime?: string;
  }) => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set the updating flag to prevent useEffect from overwriting
    isUpdatingRef.current = true;

    // Debounce the parent notification
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(updates);
      // Clear the flag after a delay to allow parent re-render to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }, 10);
  }, [onUpdate]);

  /**
   * Update start date parts
   * Fixed: Separate state update from parent notification to avoid race conditions
   */
  const updateStartDate = useCallback((updates: Partial<DateParts>) => {
    // Update local state immediately for UI responsiveness
    setLocalStartParts(prev => {
      const newParts = { ...prev, ...updates };
      
      // Build date string from new parts
      const newDate = buildDateString({
        year: newParts.year,
        month: newParts.month,
        day: newParts.day
      });

      // Debounced notification to parent
      debouncedOnUpdate({ eventDate: newDate || undefined });

      return newParts;
    });
  }, [debouncedOnUpdate]);

  /**
   * Update end date parts
   * Fixed: Separate state update from parent notification to avoid race conditions
   */
  const updateEndDate = useCallback((updates: Partial<DateParts>) => {
    setLocalEndParts(prev => {
      const newParts = { ...prev, ...updates };
      
      const newDate = buildDateString({
        year: newParts.year,
        month: newParts.month,
        day: newParts.day
      });

      debouncedOnUpdate({ endDate: newDate || undefined });

      return newParts;
    });
  }, [debouncedOnUpdate]);

  /**
   * Update time
   * Fixed: Use debounced update and proper state management
   */
  const updateTime = useCallback((hour: string, minute: string) => {
    setLocalTimeParts({ hour, minute });

    const newTime = buildTimeString(hour, minute);
    debouncedOnUpdate({ eventTime: newTime || undefined });
  }, [debouncedOnUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // ============ RENDERERS FOR EACH PRECISION ============

  /**
   * Year Range: Start Year → End Year
   */
  const renderYearRange = () => (
    <div className="bg-[var(--prism-canvas)] p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <span className="text-black text-xl font-medium">→</span>
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>
      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Month Range: Start Month/Year → End Month/Year
   */
  const renderMonthRange = () => (
    <div className="bg-[var(--prism-canvas)] p-4 rounded-lg space-y-2">
      {/* Start Date */}
      <div className="flex gap-3">
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Start Month"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
      </div>

      <RangeArrow />

      {/* End Date */}
      <div className="flex gap-3">
        <MonthSelect
          value={localEndParts.month}
          onChange={(month) => updateEndDate({ month })}
          placeholder="End Month"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>

      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Month & Year
   */
  const renderMonthYear = () => (
    <div className="bg-[var(--prism-canvas)] p-4 rounded-lg space-y-3">
      <div className="flex gap-3">
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Month"
          hasError={!!validation.error}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error}
        />
      </div>
      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Date Range: Start Date → End Date
   */
  const renderDateRange = () => (
    <div className="bg-[var(--prism-canvas)] p-4 rounded-lg space-y-2">
      {/* Start Date */}
      <div className="flex gap-3">
        <DaySelect
          value={localStartParts.day}
          onChange={(day) => updateStartDate({ day })}
          year={localStartParts.year}
          month={localStartParts.month}
          placeholder="Start Day"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Start Month"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
      </div>

      <RangeArrow />

      {/* End Date */}
      <div className="flex gap-3">
        <DaySelect
          value={localEndParts.day}
          onChange={(day) => updateEndDate({ day })}
          year={localEndParts.year || localStartParts.year}
          month={localEndParts.month || localStartParts.month}
          placeholder="End Day"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <MonthSelect
          value={localEndParts.month}
          onChange={(month) => updateEndDate({ month })}
          placeholder="End Month"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>

      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Exact Date or Exact Date & Time
   */
  const renderExactDate = () => (
    <div className="space-y-3">
      <div className="bg-[var(--prism-canvas)] p-4 rounded-lg">
        <div className="flex gap-3">
          <DaySelect
            value={localStartParts.day}
            onChange={(day) => updateStartDate({ day })}
            year={localStartParts.year}
            month={localStartParts.month}
            placeholder="Day"
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
          <MonthSelect
            value={localStartParts.month}
            onChange={(month) => updateStartDate({ month })}
            placeholder="Month"
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
          <YearSelect
            value={localStartParts.year}
            onChange={(year) => updateStartDate({ year })}
            placeholder="Year"
            minYear={minYear}
            maxYear={maxYear}
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
        </div>

        {precision === 'exact_date' && <ErrorDisplay error={validation.error} />}
      </div>

      {/* Time selector for exact_date_time */}
      {precision === 'exact_date_time' && (
        <div className="bg-[var(--prism-canvas)] p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#636363] font-medium">Time:</label>
            <TimeSelect
              hour={localTimeParts.hour}
              minute={localTimeParts.minute}
              onChange={updateTime}
              hasError={!!validation.error && validation.error.includes('Time')}
            />
          </div>
          <ErrorDisplay error={validation.error} />
        </div>
      )}
    </div>
  );

  // ============ MAIN RENDER ============

  switch (precision) {
    case 'year_range':
      return renderYearRange();
    case 'month_range':
      return renderMonthRange();
    case 'month_year':
      return renderMonthYear();
    case 'date_range':
      return renderDateRange();
    case 'exact_date':
    case 'exact_date_time':
      return renderExactDate();
    default:
      return null;
  }
}

// Export types for consumers
export type { DateInputProps };
