import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CandidateComparisonView from './CandidateComparisonView';

const mockCandidates = [
  {
    time: '12:30:00',
    score: 85.5,
    stage: 3,
    rank: 1,
    reason: 'Strong Dasha correlation',
    offsetMinutes: 30,
    minifiedEph: { sun: 'Leo 15°', moon: 'Sag 8°', ascendant: 'Virgo 2°' },
    d60: 'Aries',
    boundaryDistance: 0.5,
    eventMatches: [{ event: 'Marriage', matches: true, dasha: 'Jupiter-Venus' }],
  },
  {
    time: '12:15:00',
    score: 72.3,
    stage: 3,
    rank: 2,
    reason: 'Good transit alignment',
    offsetMinutes: 15,
    minifiedEph: { sun: 'Leo 14°', moon: 'Sag 7°', ascendant: 'Virgo 1°' },
    d60: 'Taurus',
    boundaryDistance: 0.3,
    eventMatches: [{ event: 'Marriage', matches: false, dasha: 'Saturn-Rahu' }],
  },
];

describe('CandidateComparisonView', () => {
  it('renders without crashing', () => {
    const { container } = render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(container).toBeTruthy();
  });

  it('displays the comparison header', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(screen.getByText('Candidate Comparison')).toBeInTheDocument();
  });

  it('shows candidate times', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    const times30 = screen.getAllByText('12:30:00');
    const times15 = screen.getAllByText('12:15:00');
    expect(times30.length).toBeGreaterThanOrEqual(1);
    expect(times15.length).toBeGreaterThanOrEqual(1);
  });

  it('shows candidate scores', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('72.3%')).toBeInTheDocument();
  });

  it('identifies the winner', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('shows clear winner badge when score difference > 5', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(screen.getByText('Clear Winner')).toBeInTheDocument();
  });

  it('calls onSelect when a candidate card is clicked', () => {
    const onSelect = vi.fn();
    render(<CandidateComparisonView candidates={mockCandidates} onSelect={onSelect} />);
    const cards = screen.getAllByRole('button');
    if (cards.length > 0) {
      cards[0].click();
      expect(onSelect).toHaveBeenCalledWith('12:30:00');
    }
  });

  it('shows comparison rows', () => {
    render(<CandidateComparisonView candidates={mockCandidates} />);
    expect(screen.getByText('Sun Position')).toBeInTheDocument();
    expect(screen.getByText('Moon Position')).toBeInTheDocument();
    expect(screen.getByText('Ascendant')).toBeInTheDocument();
  });

  it('shows fallback when less than 2 candidates', () => {
    render(<CandidateComparisonView candidates={[mockCandidates[0]]} />);
    expect(screen.getByText('At least 2 candidates required for comparison')).toBeInTheDocument();
  });

  it('renders with aria-label prop', () => {
    render(<CandidateComparisonView candidates={mockCandidates} aria-label="Test Comparison" />);
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Test Comparison');
  });
});
