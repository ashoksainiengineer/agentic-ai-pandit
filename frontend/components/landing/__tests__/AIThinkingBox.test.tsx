import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIThinkingBox from '../AIThinkingBox';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => (
      <div className={className as string} {...props}>{children as React.ReactNode}</div>
    ),
  },
}));

describe('AIThinkingBox', () => {
  it('renders the AI Thinking Process header', () => {
    render(<AIThinkingBox />);
    expect(screen.getByText('AI Thinking Process')).toBeInTheDocument();
  });

  it('renders all 4 analysis step labels', () => {
    render(<AIThinkingBox />);
    expect(
      screen.getByText('Skyfield ephemeris — calculating planetary positions'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vimshottari Dasha periods — cross-referencing events'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('KP Sub-lord precision — narrowing time window'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Shadbala strength — validating house placements'),
    ).toBeInTheDocument();
  });

  it('shows emerald dots for the 2 completed steps', () => {
    const { container } = render(<AIThinkingBox />);
    const doneDots = container.querySelectorAll('.bg-emerald-500');
    expect(doneDots).toHaveLength(2);
  });

  it('shows amber pulse dots for the 2 active (non-done) steps', () => {
    const { container } = render(<AIThinkingBox />);
    const amberDots = container.querySelectorAll('.bg-amber-500');
    expect(amberDots).toHaveLength(2);
  });

  it('renders the progress bar', () => {
    const { container } = render(<AIThinkingBox />);
    const innerBar = container.querySelector('.h-full.rounded-full');
    expect(innerBar).toBeInTheDocument();
  });

  it('renders the pulsing status dot in header', () => {
    const { container } = render(<AIThinkingBox />);
    const pulseDot = container.querySelector('.animate-pulse');
    expect(pulseDot).toBeInTheDocument();
  });
});
