import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CandidateComparisonTable from '../CandidateComparisonTable';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => (
      <div className={className as string} {...props}>{children as React.ReactNode}</div>
    ),
  },
}));

describe('CandidateComparisonTable', () => {
  it('renders the Candidate Comparison header', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('Candidate Comparison')).toBeInTheDocument();
  });

  it('renders all 4 candidate time entries', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('14:32:18')).toBeInTheDocument();
    expect(screen.getByText('14:31:45')).toBeInTheDocument();
    expect(screen.getByText('14:33:02')).toBeInTheDocument();
    expect(screen.getByText('14:30:28')).toBeInTheDocument();
  });

  it('displays scores for all candidates', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('94.2%')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('82.1%')).toBeInTheDocument();
    expect(screen.getByText('76.8%')).toBeInTheDocument();
  });

  it('shows "Best" badge for the highest-scoring candidate (94.2%)', () => {
    render(<CandidateComparisonTable />);
    const bestBadges = screen.getAllByText('Best');
    expect(bestBadges).toHaveLength(1);
  });

  it('renders score bars for all 4 candidates', () => {
    const { container } = render(<CandidateComparisonTable />);
    const scoreBars = container.querySelectorAll('.h-1\\.5');
    expect(scoreBars).toHaveLength(4);
  });

  it('renders the footer with consensus text', () => {
    render(<CandidateComparisonTable />);
    expect(screen.getByText('Highest confidence match')).toBeInTheDocument();
    expect(
      screen.getByText('Dasha + KP + Shadbala consensus'),
    ).toBeInTheDocument();
  });

  it('renders the pulsing status dot', () => {
    const { container } = render(<CandidateComparisonTable />);
    const pulseDot = container.querySelector('.animate-pulse');
    expect(pulseDot).toBeInTheDocument();
  });
});
