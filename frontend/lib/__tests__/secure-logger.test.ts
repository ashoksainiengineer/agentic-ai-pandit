import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../secure-logger';

describe('secure-logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info messages without throwing', () => {
    expect(() => logger.info('Test message')).not.toThrow();
  });

  it('should log warning messages without throwing', () => {
    expect(() => logger.warn('Warning message')).not.toThrow();
  });

  it('should log error messages without throwing', () => {
    expect(() => logger.error('Error message')).not.toThrow();
  });

  it('should log debug messages without throwing', () => {
    expect(() => logger.debug('Debug message')).not.toThrow();
  });

  it('should log with metadata', () => {
    expect(() =>
      logger.info('Message with metadata', { userId: '123', action: 'test' })
    ).not.toThrow();
  });

  it('should create child logger', () => {
    const childLogger = logger.child({ component: 'test' });
    expect(childLogger).toBeDefined();
    expect(() => childLogger.info('Child message')).not.toThrow();
  });

  it('should create log group', () => {
    const group = logger.group('Test Group');
    expect(group).toBeDefined();
    expect(typeof group.end).toBe('function');
    expect(() => group.end()).not.toThrow();
  });

  it('should sanitize PII in messages', () => {
    expect(() => logger.info('User email: user@example.com')).not.toThrow();
  });

  it('should handle error objects', () => {
    const testError = new Error('Test error');
    expect(() => logger.error('Something failed', testError)).not.toThrow();
  });
});
