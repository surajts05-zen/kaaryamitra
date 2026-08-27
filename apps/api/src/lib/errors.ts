// ─────────────────────────────────────────────────────────────────────────────
// KaaryaMitra — Typed Application Errors
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_SUSPENDED'
  | 'TENANT_REQUIRED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'AUTHENTICATION_REQUIRED', message);
  }

  static invalidCredentials() {
    return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  static tokenExpired() {
    return new AppError(401, 'TOKEN_EXPIRED', 'Session expired, please log in again');
  }

  static forbidden(message = 'Access denied') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static insufficientPermission(action: string) {
    return new AppError(403, 'INSUFFICIENT_PERMISSION', `You do not have permission to: ${action}`);
  }

  static notFound(resource: string) {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static tenantNotFound(slug: string) {
    return new AppError(404, 'TENANT_NOT_FOUND', `Workspace '${slug}' does not exist`);
  }

  static tenantSuspended() {
    return new AppError(403, 'TENANT_SUSPENDED', 'This workspace has been suspended');
  }

  static internal(message = 'Internal server error') {
    return new AppError(500, 'INTERNAL_ERROR', message, undefined, false);
  }
}
