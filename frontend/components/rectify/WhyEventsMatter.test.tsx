import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WhyEventsMatter from './WhyEventsMatter';

describe('WhyEventsMatter', () => {
  it('renders without crashing', () => {
    const { container } = render(<WhyEventsMatter currentEventCount={5} categoriesCovered={2} />);
    expect(container).toBeTruthy();
  });

  it('displays the header text', () => {
    render(<WhyEventsMatter currentEventCount={5} categoriesCovered={2} />);
    expect(screen.getByText('Why Add More Events?')).toBeInTheDocument();
  });

  it('shows current event count', () => {
    render(<WhyEventsMatter currentEventCount={12} categoriesCovered={3} />);
    expect(screen.getByText('12/40')).toBeInTheDocument();
  });

  it('shows correct accuracy level for low event count', () => {
    render(<WhyEventsMatter currentEventCount={5} categoriesCovered={1} />);
    expect(screen.getByText('Basic Verification')).toBeInTheDocument();
  });

  it('shows correct accuracy level for medium event count', () => {
    render(<WhyEventsMatter currentEventCount={15} categoriesCovered={5} />);
    expect(screen.getByText('Good Progress')).toBeInTheDocument();
  });

  it('shows correct accuracy level for high event count', () => {
    render(<WhyEventsMatter currentEventCount={25} categoriesCovered={8} />);
    expect(screen.getByText('Excellent Dataset')).toBeInTheDocument();
  });

  it('shows god tier level for 35+ events', () => {
    render(<WhyEventsMatter currentEventCount={38} categoriesCovered={12} />);
    expect(screen.getByText('God Tier Precision')).toBeInTheDocument();
  });

  it('shows events to next level when applicable', () => {
    render(<WhyEventsMatter currentEventCount={8} categoriesCovered={2} />);
    const addTexts = screen.getAllByText(/Add/);
    expect(addTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/more events/)).toBeInTheDocument();
  });

  it('shows overview tab content when expanded', async () => {
    render(<WhyEventsMatter currentEventCount={5} categoriesCovered={2} />);
    const header = screen.getByText('Why Add More Events?').closest('div[class*="cursor-pointer"]');
    if (header) {
      header.click();
      expect(await screen.findByText('Accuracy Progression')).toBeInTheDocument();
    }
  });
});
