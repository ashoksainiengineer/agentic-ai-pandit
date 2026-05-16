import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BirthPlacePicker from '../BirthPlacePicker';
import React from 'react';

vi.mock('next/dynamic', () => ({
    __esModule: true,
    default: () => {
        const MockMap = ({ onLocationSelect }: any) => (
            <div data-testid="interactive-map">
                <button onClick={() => onLocationSelect(28.7, 77.2)}>Select Map Location</button>
            </div>
        );
        return MockMap;
    },
}));

vi.mock('lucide-react', () => ({
    MapPin: () => <span data-testid="icon-mappin">📍</span>,
    Search: () => <span data-testid="icon-search">🔍</span>,
    Crosshair: () => <span data-testid="icon-crosshair">🎯</span>,
    Globe: () => <span data-testid="icon-globe">🌐</span>,
    X: () => <span data-testid="icon-x">✕</span>,
}));

vi.mock('@/lib/secure-logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

function clickTab(tabText: string) {
    const span = screen.getByText(tabText);
    const btn = span.closest('button');
    if (!btn) throw new Error(`Tab button for "${tabText}" not found`);
    fireEvent.click(btn);
}

describe('BirthPlacePicker', () => {
    const mockOnUpdate = vi.fn();

    const defaultProps = {
        birthPlace: '',
        latitude: 0,
        longitude: 0,
        timezone: 5.5,
        onUpdate: mockOnUpdate,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('rendering', () => {
        it('renders the search mode by default', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            expect(screen.getByPlaceholderText('Type city name...')).toBeInTheDocument();
            expect(screen.getByText('Search')).toBeInTheDocument();
            expect(screen.getByText('Manual Coordinates')).toBeInTheDocument();
            expect(screen.getByText('Map')).toBeInTheDocument();
        });

        it('renders with pre-filled birthPlace in search input', () => {
            render(<BirthPlacePicker {...defaultProps} birthPlace="Mumbai, India" />);
            const input = screen.getByPlaceholderText('Type city name...') as HTMLInputElement;
            expect(input.value).toBe('Mumbai, India');
        });

        it('renders mode tabs as buttons', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            expect(screen.getByText('Search').closest('button')).toBeInTheDocument();
            expect(screen.getByText('Manual Coordinates').closest('button')).toBeInTheDocument();
            expect(screen.getByText('Map').closest('button')).toBeInTheDocument();
        });
    });

    describe('mode switching', () => {
        it('switches to manual coordinates mode', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Manual Coordinates');
            expect(screen.getByPlaceholderText('28.6139')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('77.2090')).toBeInTheDocument();
            expect(screen.getByText('Apply Coordinates')).toBeInTheDocument();
        });

        it('switches to map mode', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Map');
            expect(screen.getByPlaceholderText('Search location...')).toBeInTheDocument();
            expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
        });

        it('switches back to search mode from manual', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Manual Coordinates');
            clickTab('Search');
            expect(screen.getByPlaceholderText('Type city name...')).toBeInTheDocument();
        });
    });

    describe('search mode', () => {
        it('shows search results when typing and selecting a city', async () => {
            const mockResults = [
                {
                    place_id: '123',
                    name: 'Delhi',
                    display_name: 'Delhi, India',
                    lat: '28.6139',
                    lon: '77.2090',
                    address: { city: 'Delhi', state: 'Delhi', country: 'India', postcode: '110001' },
                },
            ];

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResults,
            } as any);

            render(<BirthPlacePicker {...defaultProps} />);

            const input = screen.getByPlaceholderText('Type city name...');
            fireEvent.change(input, { target: { value: 'DelhiSearch' } });

            await vi.advanceTimersByTimeAsync(500);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('nominatim.openstreetmap.org'),
                expect.any(Object)
            );
        });

        it('displays error message when search fails', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            render(<BirthPlacePicker {...defaultProps} />);

            const input = screen.getByPlaceholderText('Type city name...');
            fireEvent.change(input, { target: { value: 'ErrorCity' } });

            await vi.advanceTimersByTimeAsync(500);

            await waitFor(() => {
                expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
            });
        });

        it('clears search input when clear button is clicked', () => {
            render(<BirthPlacePicker {...defaultProps} birthPlace="Mumbai" />);

            const clearBtn = screen.getByTestId('icon-x').closest('button');
            if (clearBtn) {
                fireEvent.click(clearBtn);
            }

            const input = screen.getByPlaceholderText('Type city name...') as HTMLInputElement;
            expect(input.value).toBe('');
        });

        it('does not search for queries shorter than 2 characters', async () => {
            global.fetch = vi.fn();

            render(<BirthPlacePicker {...defaultProps} />);

            const input = screen.getByPlaceholderText('Type city name...');
            fireEvent.change(input, { target: { value: 'D' } });

            await vi.advanceTimersByTimeAsync(500);

            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('manual coordinates mode', () => {
        it('updates coordinates when valid values are entered', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Manual Coordinates');

            const latInput = screen.getByPlaceholderText('28.6139') as HTMLInputElement;
            const lngInput = screen.getByPlaceholderText('77.2090') as HTMLInputElement;

            fireEvent.change(latInput, { target: { value: '28.6139' } });
            fireEvent.change(lngInput, { target: { value: '77.2090' } });

            fireEvent.click(screen.getByText('Apply Coordinates'));

            expect(mockOnUpdate).toHaveBeenCalledWith({
                birthPlace: '28.6139°N, 77.2090°E',
                latitude: 28.6139,
                longitude: 77.2090,
                timezone: 5.5,
            });
        });

        it('does not update with invalid coordinates', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Manual Coordinates');

            const latInput = screen.getByPlaceholderText('28.6139') as HTMLInputElement;
            const lngInput = screen.getByPlaceholderText('77.2090') as HTMLInputElement;

            fireEvent.change(latInput, { target: { value: 'invalid' } });
            fireEvent.change(lngInput, { target: { value: 'invalid' } });

            fireEvent.click(screen.getByText('Apply Coordinates'));

            expect(mockOnUpdate).not.toHaveBeenCalled();
        });

        it('does not update with out-of-range latitude', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Manual Coordinates');

            const latInput = screen.getByPlaceholderText('28.6139') as HTMLInputElement;
            const lngInput = screen.getByPlaceholderText('77.2090') as HTMLInputElement;

            fireEvent.change(latInput, { target: { value: '95' } });
            fireEvent.change(lngInput, { target: { value: '77.2090' } });

            fireEvent.click(screen.getByText('Apply Coordinates'));

            expect(mockOnUpdate).not.toHaveBeenCalled();
        });

        it('shows current coordinates when latitude and longitude are provided', () => {
            render(
                <BirthPlacePicker
                    {...defaultProps}
                    latitude={28.6139}
                    longitude={77.2090}
                    timezone={5.5}
                />
            );
            clickTab('Manual Coordinates');

            expect(screen.getByText('✓ Current:')).toBeInTheDocument();
        });
    });

    describe('map mode', () => {
        it('renders map picker with search input', () => {
            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Map');

            expect(screen.getByPlaceholderText('Search location...')).toBeInTheDocument();
            expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
        });

        it('calls onUpdate when map location is selected', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    address: { city: 'TestCity', country: 'India' },
                }),
            } as any);

            render(<BirthPlacePicker {...defaultProps} />);
            clickTab('Map');

            const selectBtn = screen.getByText('Select Map Location');
            fireEvent.click(selectBtn);

            await waitFor(() => {
                expect(mockOnUpdate).toHaveBeenCalled();
            });
        });
    });

    describe('props and callbacks', () => {
        it('initializes with provided latitude and longitude values', () => {
            render(
                <BirthPlacePicker
                    {...defaultProps}
                    latitude={19.0760}
                    longitude={72.8777}
                    timezone={5.5}
                />
            );
            clickTab('Manual Coordinates');

            const latInput = screen.getByPlaceholderText('28.6139') as HTMLInputElement;
            const lngInput = screen.getByPlaceholderText('77.2090') as HTMLInputElement;

            expect(latInput.value).toBe('19.076');
            expect(lngInput.value).toBe('72.8777');
        });
    });

    describe('error states', () => {
        it('handles HTTP error response from search API', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            } as any);

            render(<BirthPlacePicker {...defaultProps} />);

            const input = screen.getByPlaceholderText('Type city name...');
            fireEvent.change(input, { target: { value: 'HttpError' } });

            await vi.advanceTimersByTimeAsync(500);

            await waitFor(() => {
                expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
            });
        });

        it('handles abort error silently (user cancelled)', async () => {
            global.fetch = vi.fn().mockRejectedValue(
                new DOMException('Aborted', 'AbortError')
            );

            render(<BirthPlacePicker {...defaultProps} />);

            const input = screen.getByPlaceholderText('Type city name...');
            fireEvent.change(input, { target: { value: 'AbortTest' } });

            await vi.advanceTimersByTimeAsync(500);

            await waitFor(() => {
                expect(screen.queryByText('Search failed. Please try again.')).not.toBeInTheDocument();
            });
        });
    });
});
