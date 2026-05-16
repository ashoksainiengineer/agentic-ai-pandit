import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisErrorBoundary, SectionErrorBoundary } from './AnalysisErrorBoundary';

const ThrowError = ({ message = 'Test error' }: { message?: string }) => {
  throw new Error(message);
};

describe('AnalysisErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <AnalysisErrorBoundary>
        <div data-testid="child">Safe content</div>
      </AnalysisErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('catches errors and shows fallback UI', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary sectionName="TestSection">
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText('TestSection Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('shows generic error title when no section name', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary>
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('shows error ID for support tracking', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary sectionName="TestSection">
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary onError={onError}>
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary fallback={<div data-testid="custom-fallback">Custom fallback</div>}>
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('has reload page button for non-recoverable errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary sectionName="AnalysisPage">
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('has try again button for recoverable errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary sectionName="SomeSection">
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('has dashboard link', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AnalysisErrorBoundary sectionName="TestSection">
        <ThrowError />
      </AnalysisErrorBoundary>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});

describe('SectionErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary sectionName="TestSection">
        <div data-testid="child">Safe content</div>
      </SectionErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows compact fallback on error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary sectionName="ChartSection">
        <ThrowError />
      </SectionErrorBoundary>
    );
    expect(screen.getByText('ChartSection temporarily unavailable')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
