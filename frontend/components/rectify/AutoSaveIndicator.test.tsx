import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AutoSaveIndicator from './AutoSaveIndicator';

describe('AutoSaveIndicator', () => {
  it('returns null for idle status', () => {
    const { container } = render(<AutoSaveIndicator status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows saving indicator', () => {
    render(<AutoSaveIndicator status="saving" />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows saved indicator', () => {
    render(<AutoSaveIndicator status="saved" />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows error indicator', () => {
    render(<AutoSaveIndicator status="error" />);
    expect(screen.getByText('Save failed')).toBeInTheDocument();
  });
});
