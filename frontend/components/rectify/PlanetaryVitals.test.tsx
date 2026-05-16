import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanetaryVitals } from './PlanetaryVitals';
import type { PlanetPosition } from '@ai-pandit/shared';

const mockAsc: PlanetPosition = { longitude: 120, latitude: 0, speed: 0, sign: 'Leo', house: 1, nakshatra: 'Magha', retrograde: false };
const mockPlanets: Record<string, PlanetPosition> = {
  Sun: mockAsc,
  Moon: { ...mockAsc, sign: 'Sagittarius', nakshatra: 'Mula' },
};
const mockEphemeris = {
  planets: mockPlanets, houses: {} as any, ascendant: mockAsc,
  ayanamsa: 24.13, date: '1990-01-01', time: '12:00', latitude: 19.0, longitude: 72.8,
} as any;
const mockD9 = { ascendant: mockAsc, planets: {} } as any;
const mockD10 = { ascendant: mockAsc, planets: {} } as any;
const mockD60 = { ascendant: mockAsc, planets: {} } as any;

describe('PlanetaryVitals', () => {
  it('renders planet data table', () => {
    render(<PlanetaryVitals ephemeris={mockEphemeris} divCharts={{ D9: mockD9, D10: mockD10, D60: mockD60 }} />);
    expect(screen.getByText('Planetary Vitals (Nirayana)')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });
});
