import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateInput from '../DateInput';
import React from 'react';

const mockValidateDate = vi.fn(() => ({ valid: true })) as any;
const mockValidateDateTime = vi.fn(() => ({ valid: true })) as any;
const mockValidateMonthYear = vi.fn(() => ({ valid: true })) as any;
const mockValidateDateRange = vi.fn(() => ({ valid: true })) as any;
const mockValidateMonthRange = vi.fn(() => ({ valid: true })) as any;
const mockValidateYearRange = vi.fn(() => ({ valid: true })) as any;

vi.mock('@/lib/date-utils', () => ({
    parseDateParts: (dateStr: string) => {
        if (!dateStr) return { year: '', month: '', day: '' };
        const parts = dateStr.split('-');
        return { year: parts[0] || '', month: parts[1] || '', day: parts[2] || '' };
    },
    parseTimeParts: (timeStr: string) => {
        if (!timeStr) return { hour: '', minute: '' };
        const parts = timeStr.split(':');
        return { hour: parts[0] || '', minute: parts[1] || '' };
    },
    validateDate: (...args: any[]) => mockValidateDate(...args),
    validateDateTime: (...args: any[]) => mockValidateDateTime(...args),
    validateMonthYear: (...args: any[]) => mockValidateMonthYear(...args),
    validateDateRange: (...args: any[]) => mockValidateDateRange(...args),
    validateMonthRange: (...args: any[]) => mockValidateMonthRange(...args),
    validateYearRange: (...args: any[]) => mockValidateYearRange(...args),
    getAvailableDays: () => Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
    buildDateString: (parts: any) => {
        if (!parts.year && !parts.month && !parts.day) return '';
        return `${parts.year}-${parts.month?.padStart(2, '0') || ''}-${parts.day?.padStart(2, '0') || ''}`.replace(/-$/, '');
    },
    buildTimeString: (hour: string, minute: string) => {
        if (!hour || !minute) return '';
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    },
    isDateComplete: () => true,
    compareDates: () => 0,
    DATE_CONSTANTS: {
        MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        HOURS: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
        MINUTES: Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')),
    },
}));

vi.mock('lucide-react', () => ({
    AlertCircle: () => <span data-testid="icon-alert">⚠</span>,
}));

describe('DateInput', () => {
    const mockOnUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockValidateDate.mockReturnValue({ valid: true });
        mockValidateDateTime.mockReturnValue({ valid: true });
        mockValidateMonthYear.mockReturnValue({ valid: true });
        mockValidateDateRange.mockReturnValue({ valid: true });
        mockValidateMonthRange.mockReturnValue({ valid: true });
        mockValidateYearRange.mockReturnValue({ valid: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('rendering', () => {
        it('renders exact_date precision with day, month, year selects', () => {
            render(<DateInput precision="exact_date" eventDate="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Day')).toBeInTheDocument();
            expect(screen.getByText('Month')).toBeInTheDocument();
            expect(screen.getByText('Year')).toBeInTheDocument();
        });

        it('renders exact_date_time precision with time selector', () => {
            render(<DateInput precision="exact_date_time" eventDate="" eventTime="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Day')).toBeInTheDocument();
            expect(screen.getByText('Month')).toBeInTheDocument();
            expect(screen.getByText('Year')).toBeInTheDocument();
            expect(screen.getByText('Time:')).toBeInTheDocument();
        });

        it('renders year_range precision with start and end year selects', () => {
            render(<DateInput precision="year_range" eventDate="" endDate="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Start Year')).toBeInTheDocument();
            expect(screen.getByText('End Year')).toBeInTheDocument();
        });

        it('renders month_range precision with start and end month/year', () => {
            render(<DateInput precision="month_range" eventDate="" endDate="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Start Month')).toBeInTheDocument();
            expect(screen.getByText('Start Year')).toBeInTheDocument();
            expect(screen.getByText('End Month')).toBeInTheDocument();
            expect(screen.getByText('End Year')).toBeInTheDocument();
        });

        it('renders month_year precision with month and year only', () => {
            render(<DateInput precision="month_year" eventDate="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Month')).toBeInTheDocument();
            expect(screen.getByText('Year')).toBeInTheDocument();
            expect(screen.queryByText('Day')).not.toBeInTheDocument();
        });

        it('renders date_range precision with full start and end dates', () => {
            render(<DateInput precision="date_range" eventDate="" endDate="" onUpdate={mockOnUpdate} />);
            expect(screen.getByText('Start Day')).toBeInTheDocument();
            expect(screen.getByText('End Day')).toBeInTheDocument();
        });
    });

    describe('user interactions', () => {
        it('calls onUpdate when day is selected', async () => {
            render(<DateInput precision="exact_date" eventDate="" onUpdate={mockOnUpdate} />);

            const daySelect = screen.getAllByRole('combobox')[0];
            fireEvent.change(daySelect, { target: { value: '15' } });

            await vi.advanceTimersByTimeAsync(50);

            expect(mockOnUpdate).toHaveBeenCalled();
        });

        it('calls onUpdate when month is selected', async () => {
            render(<DateInput precision="exact_date" eventDate="" onUpdate={mockOnUpdate} />);

            const monthSelect = screen.getAllByRole('combobox')[1];
            fireEvent.change(monthSelect, { target: { value: '6' } });

            await vi.advanceTimersByTimeAsync(50);

            expect(mockOnUpdate).toHaveBeenCalled();
        });

        it('calls onUpdate when year is selected', async () => {
            render(<DateInput precision="exact_date" eventDate="" onUpdate={mockOnUpdate} />);

            const yearSelect = screen.getAllByRole('combobox')[2];
            fireEvent.change(yearSelect, { target: { value: '1990' } });

            await vi.advanceTimersByTimeAsync(50);

            expect(mockOnUpdate).toHaveBeenCalled();
        });

        it('calls onUpdate when time is selected', async () => {
            render(<DateInput precision="exact_date_time" eventDate="" eventTime="" onUpdate={mockOnUpdate} />);

            const hourSelect = screen.getAllByRole('combobox')[3];
            fireEvent.change(hourSelect, { target: { value: '14' } });

            await vi.advanceTimersByTimeAsync(50);

            expect(mockOnUpdate).toHaveBeenCalled();
        });

        it('calls onUpdate for end date in date_range mode', async () => {
            render(<DateInput precision="date_range" eventDate="" endDate="" onUpdate={mockOnUpdate} />);

            const endDaySelect = screen.getAllByRole('combobox')[3];
            fireEvent.change(endDaySelect, { target: { value: '20' } });

            await vi.advanceTimersByTimeAsync(50);

            expect(mockOnUpdate).toHaveBeenCalled();
        });
    });

    describe('props', () => {
        it('initializes with provided eventDate', () => {
            render(<DateInput precision="exact_date" eventDate="1990-05-20" onUpdate={mockOnUpdate} />);
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(3);
        });

        it('respects minYear and maxYear constraints', () => {
            render(<DateInput precision="exact_date" eventDate="" onUpdate={mockOnUpdate} minYear={2000} maxYear={2020} />);

            const yearSelect = screen.getAllByRole('combobox')[2];
            const options = yearSelect.querySelectorAll('option');
            const values = Array.from(options).map(o => (o as HTMLOptionElement).value).filter(Boolean);

            expect(values).toContain('2000');
            expect(values).toContain('2020');
        });
    });

    describe('error states', () => {
        it('displays validation error when validateDate returns error', async () => {
            mockValidateDate.mockReturnValue({ valid: false, error: 'Invalid date selected' });

            render(<DateInput precision="exact_date" eventDate="2020-02-30" onUpdate={mockOnUpdate} />);

            await vi.advanceTimersByTimeAsync(50);

            expect(screen.getByText('Invalid date selected')).toBeInTheDocument();
        });

        it('displays validation error for invalid date range', async () => {
            mockValidateDateRange.mockReturnValue({ valid: false, error: 'Start date must be before end date' });

            render(<DateInput precision="date_range" eventDate="2020-01-01" endDate="2019-01-01" onUpdate={mockOnUpdate} />);

            await vi.advanceTimersByTimeAsync(50);

            expect(screen.getByText('Start date must be before end date')).toBeInTheDocument();
        });
    });
});
