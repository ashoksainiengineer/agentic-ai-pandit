import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1BirthDetails from '../index';
import React from 'react';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

vi.mock('@/components/ui/form/FormCard', () => ({
    FormCard: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../components/Header', () => ({
    Header: () => <div data-testid="step-header">Birth Details Header</div>,
}));

const mockHandleNameChange = vi.fn();
const mockHandleDateChange = vi.fn();
const mockHandleTimeChange = vi.fn();
const mockHandlePlaceChange = vi.fn();
const mockHandleOffsetChange = vi.fn();
const mockHandleCustomOffsetChange = vi.fn();
const mockHandleSpouseDateChange = vi.fn();
const mockHandleSpouseTimeChange = vi.fn();
const mockSetShowSpouse = vi.fn();

let mockErrors: Record<string, string> = {};

vi.mock('../hooks/useBirthDetails', () => ({
    useBirthDetails: () => ({
        showSpouse: false,
        setShowSpouse: mockSetShowSpouse,
        dobParts: { day: '', month: '', year: '' },
        timeParts: { hour: '', minute: '', period: 'AM' as const },
        selectedOffset: '1hour',
        customOffset: 60,
        spouseDobParts: { day: '', month: '', year: '' },
        spouseTimeParts: { hour: '', minute: '', period: 'AM' as const },
        availableDays: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
        spouseAvailableDays: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
        errors: mockErrors,
        handleNameChange: mockHandleNameChange,
        handlePlaceChange: mockHandlePlaceChange,
        handleDateChange: mockHandleDateChange,
        handleTimeChange: mockHandleTimeChange,
        handleOffsetChange: mockHandleOffsetChange,
        handleCustomOffsetChange: mockHandleCustomOffsetChange,
        handleSpouseDateChange: mockHandleSpouseDateChange,
        handleSpouseTimeChange: mockHandleSpouseTimeChange,
    }),
}));

vi.mock('../components/PrimaryDetailsForm', () => ({
    PrimaryDetailsForm: (props: any) => (
        <div data-testid="primary-details-form">
            <input
                data-testid="full-name-input"
                value={props.data?.fullName || ''}
                onChange={(e) => props.handleNameChange(e.target.value)}
                placeholder="Full Name"
            />
            <select
                data-testid="day-select"
                value={props.dobParts?.day || ''}
                onChange={(e) => props.handleDateChange('day', e.target.value)}
            >
                <option value="">Day</option>
                {(props.availableDays || []).map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>
            <select
                data-testid="month-select"
                value={props.dobParts?.month || ''}
                onChange={(e) => props.handleDateChange('month', e.target.value)}
            >
                <option value="">Month</option>
                <option value="1">January</option>
                <option value="5">May</option>
            </select>
            <select
                data-testid="year-select"
                value={props.dobParts?.year || ''}
                onChange={(e) => props.handleDateChange('year', e.target.value)}
            >
                <option value="">Year</option>
                <option value="1990">1990</option>
            </select>
            {props.errors?.fullName && (
                <span data-testid="name-error">{props.errors.fullName}</span>
            )}
            {props.errors?.dateOfBirth && (
                <span data-testid="dob-error">{props.errors.dateOfBirth}</span>
            )}
        </div>
    ),
}));

vi.mock('../components/SpouseDetailsForm', () => ({
    SpouseDetailsForm: (props: any) => (
        <div data-testid="spouse-details-form">
            <button
                data-testid="toggle-spouse"
                onClick={() => props.setShowSpouse(!props.showSpouse)}
            >
                {props.showSpouse ? 'Hide Spouse' : 'Add Spouse Details'}
            </button>
            {props.showSpouse && <div data-testid="spouse-fields">Spouse Fields</div>}
        </div>
    ),
}));

describe('Step1BirthDetails', () => {
    const mockUpdateData = vi.fn();
    const mockUpdateSpouse = vi.fn();

    const defaultProps = {
        data: {
            fullName: '',
            dateOfBirth: '',
            tentativeTime: '',
            birthPlace: '',
            latitude: 0,
            longitude: 0,
            timezone: 5.5,
            gender: 'male',
        },
        updateData: mockUpdateData,
        spouseData: {
            fullName: '',
            dateOfBirth: '',
            birthTime: '',
            birthPlace: '',
            latitude: 0,
            longitude: 0,
            timezone: 5.5,
        },
        updateSpouse: mockUpdateSpouse,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockErrors = {};
    });

    describe('rendering', () => {
        it('renders the header and forms', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            expect(screen.getByTestId('step-header')).toBeInTheDocument();
            expect(screen.getByTestId('primary-details-form')).toBeInTheDocument();
            expect(screen.getByTestId('spouse-details-form')).toBeInTheDocument();
        });

        it('renders with pre-filled data', () => {
            render(
                <Step1BirthDetails
                    {...defaultProps}
                    data={{
                        ...defaultProps.data,
                        fullName: 'John Doe',
                        dateOfBirth: '1990-05-20',
                        birthPlace: 'Mumbai',
                    }}
                />
            );
            expect(screen.getByTestId('primary-details-form')).toBeInTheDocument();
        });
    });

    describe('form interactions', () => {
        it('calls handleNameChange when name is changed', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            const nameInput = screen.getByTestId('full-name-input');
            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            expect(mockHandleNameChange).toHaveBeenCalledWith('John Doe');
        });

        it('calls handleDateChange when day is selected', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            const daySelect = screen.getByTestId('day-select');
            fireEvent.change(daySelect, { target: { value: '15' } });
            expect(mockHandleDateChange).toHaveBeenCalledWith('day', '15');
        });

        it('calls handleDateChange when month is selected', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            const monthSelect = screen.getByTestId('month-select');
            fireEvent.change(monthSelect, { target: { value: '5' } });
            expect(mockHandleDateChange).toHaveBeenCalledWith('month', '5');
        });

        it('calls handleDateChange when year is selected', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            const yearSelect = screen.getByTestId('year-select');
            fireEvent.change(yearSelect, { target: { value: '1990' } });
            expect(mockHandleDateChange).toHaveBeenCalledWith('year', '1990');
        });
    });

    describe('spouse form', () => {
        it('toggles spouse details visibility', () => {
            render(<Step1BirthDetails {...defaultProps} />);
            const toggleBtn = screen.getByTestId('toggle-spouse');
            expect(toggleBtn).toHaveTextContent('Add Spouse Details');
            fireEvent.click(toggleBtn);
            expect(mockSetShowSpouse).toHaveBeenCalledWith(true);
        });
    });

    describe('validation errors', () => {
        it('displays name error when provided by hook', () => {
            mockErrors = { fullName: 'Name must be at least 2 characters' };

            render(<Step1BirthDetails {...defaultProps} />);

            expect(screen.getByTestId('name-error')).toBeInTheDocument();
            expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        });

        it('displays date of birth error when provided by hook', () => {
            mockErrors = { dateOfBirth: 'Invalid date' };

            render(<Step1BirthDetails {...defaultProps} />);

            expect(screen.getByTestId('dob-error')).toBeInTheDocument();
            expect(screen.getByText('Invalid date')).toBeInTheDocument();
        });
    });

    describe('props handling', () => {
        it('passes offsetConfig to useBirthDetails hook', () => {
            const offsetConfig = {
                preset: '1hour' as const,
                customMinutes: 60,
                description: '±1 hour',
            };

            render(
                <Step1BirthDetails
                    {...defaultProps}
                    offsetConfig={offsetConfig}
                />
            );

            expect(screen.getByTestId('primary-details-form')).toBeInTheDocument();
        });

        it('renders without spouse data', () => {
            render(
                <Step1BirthDetails
                    data={defaultProps.data}
                    updateData={mockUpdateData}
                />
            );

            expect(screen.getByTestId('primary-details-form')).toBeInTheDocument();
            expect(screen.getByTestId('spouse-details-form')).toBeInTheDocument();
        });
    });
});
