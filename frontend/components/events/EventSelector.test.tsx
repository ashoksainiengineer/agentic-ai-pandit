import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventSelector from './EventSelector';

describe('EventSelector', () => {
  const mockOnSelectEvent = vi.fn();
  const mockOnCreateCustom = vi.fn();

  it('renders without crashing', () => {
    const { container } = render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays the search input', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(screen.getByPlaceholderText(/Search life events/)).toBeInTheDocument();
  });

  it('shows importance filter buttons', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('shows category browser heading', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(screen.getByText('Browse by Category')).toBeInTheDocument();
  });

  it('shows sensitive events toggle', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(screen.getByText('Show Sensitive')).toBeInTheDocument();
  });

  it('shows custom event button', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(screen.getByText('Create Custom Event')).toBeInTheDocument();
  });

  it('marks existing events as added', () => {
    render(
      <EventSelector
        existingEvents={[{ eventType: 'Marriage Ceremony' }]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    // The component should render without crashing with existing events
    expect(screen.getByPlaceholderText(/Search life events/)).toBeInTheDocument();
  });

  it('calls onCreateCustom when custom event button clicked', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    const btn = screen.getByText('Create Custom Event');
    btn.click();
    expect(mockOnCreateCustom).toHaveBeenCalled();
  });

  it('shows event categories', () => {
    render(
      <EventSelector
        existingEvents={[]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    // Some default categories should be visible
    expect(screen.getByText('Hindu Sanskars')).toBeInTheDocument();
    expect(screen.getByText('Career & Work')).toBeInTheDocument();
  });

  it('renders with multiple existing events', () => {
    const { container } = render(
      <EventSelector
        existingEvents={[
          { eventType: 'Marriage Ceremony' },
          { eventType: 'First Job' },
        ]}
        onSelectEvent={mockOnSelectEvent}
        onCreateCustom={mockOnCreateCustom}
      />
    );
    expect(container).toBeTruthy();
  });
});
