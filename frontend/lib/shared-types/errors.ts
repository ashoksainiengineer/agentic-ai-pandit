/**
 * AppError — canonical error hierarchy for the AI-Pandit codebase.
 *
 * Copilot-instructions mandate: "Use AppError hierarchy for all errors — never raw Error()."
 * Every error in the system should extend AppError, carrying a machine-readable errorCode,
 * an HTTP statusCode, and an optional cause chain for debugging.
 */

export class AppError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly cause?: Error;

  constructor(
    message: string,
    options: { errorCode: string; statusCode?: number; cause?: Error },
  ) {
    super(message);
    this.name = 'AppError';
    this.errorCode = options.errorCode;
    this.statusCode = options.statusCode ?? 500;
    this.cause = options.cause;
  }

  /** JSON-safe representation for API responses and logging. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      ...(this.cause ? { cause: this.cause.message } : {}),
    };
  }
}

// ── Domain-specific subclasses ──────────────────────────────────────

export class ValidationError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'VALIDATION_ERROR', statusCode: 400, ...options });
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'DATABASE_ERROR', statusCode: 500, ...options });
    this.name = 'DatabaseError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'TIMEOUT_ERROR', statusCode: 504, ...options });
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'CONFIGURATION_ERROR', statusCode: 500, ...options });
    this.name = 'ConfigurationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'NOT_FOUND', statusCode: 404, ...options });
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'AUTHENTICATION_ERROR', statusCode: 401, ...options });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'AUTHORIZATION_ERROR', statusCode: 403, ...options });
    this.name = 'AuthorizationError';
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, { errorCode: 'PROCESSING_ERROR', statusCode: 503, ...options });
    this.name = 'ProcessingError';
  }
}
