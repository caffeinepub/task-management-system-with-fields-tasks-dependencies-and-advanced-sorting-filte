/**
 * Utility functions for detecting, normalizing, and producing structured boot diagnostics
 * with stage information including watchdog timeout stages, sanitized error messages,
 * and clipboard-safe payloads.
 */

export interface BootDiagnostics {
  stage: string;
  message: string;
  rawError: string;
  buildMarker?: string;
  timestamp?: number;
}

// Shared constant for missing profile message
export const MISSING_PROFILE_MESSAGE = 'User is not registered. Please complete profile setup.';

/**
 * Tightened detector for "User is not registered" errors.
 * Matches the exact backend trap message.
 */
export function isUserNotRegisteredError(error: unknown): boolean {
  const errorString = String(error).toLowerCase();
  return errorString.includes('user is not registered') || errorString.includes('users only');
}

/**
 * Detect if error is a stopped canister error
 */
export function isStoppedCanisterError(error: unknown): boolean {
  const errorString = String(error).toLowerCase();
  return errorString.includes('canister') && errorString.includes('stopped');
}

/**
 * Detect if error is an actor initialization timeout
 */
export function isActorInitTimeout(error: unknown): boolean {
  const errorString = String(error).toLowerCase();
  return errorString.includes('actor') && errorString.includes('timeout');
}

/**
 * Detect if error is a profile fetch timeout
 */
export function isProfileFetchTimeout(error: unknown): boolean {
  const errorString = String(error).toLowerCase();
  return errorString.includes('profile') && errorString.includes('timeout');
}

/**
 * Detect if error is a profile query disabled error
 */
export function isProfileQueryDisabled(error: unknown): boolean {
  const errorString = String(error).toLowerCase();
  return errorString.includes('query') && errorString.includes('disabled');
}

/**
 * Extract a safe, user-friendly error message from any error type.
 * Avoids exposing raw error objects or overly technical details.
 */
export function extractSafeErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (error && typeof error === 'object') {
    const anyError = error as any;
    if (anyError.message && typeof anyError.message === 'string') {
      return anyError.message;
    }
    if (anyError.reject_message && typeof anyError.reject_message === 'string') {
      return anyError.reject_message;
    }
  }

  // Fallback to string representation, but avoid [object Object]
  const errorString = String(error);
  if (errorString && errorString !== '[object Object]') {
    return errorString;
  }

  return 'An unexpected error occurred';
}

/**
 * Normalize error into a user-friendly message
 */
export function normalizeErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // Check for specific error types
  if (isUserNotRegisteredError(error)) {
    return MISSING_PROFILE_MESSAGE;
  }

  if (isStoppedCanisterError(error)) {
    return 'The backend service is temporarily unavailable. Please try again in a moment.';
  }

  if (isActorInitTimeout(error)) {
    return 'Connection to backend timed out during initialization. Please refresh and try again.';
  }

  if (isProfileFetchTimeout(error)) {
    return 'Loading your profile timed out. Please refresh and try again.';
  }

  if (isProfileQueryDisabled(error)) {
    return 'Profile query is disabled. Please ensure you are logged in.';
  }

  // Use safe extraction for other errors
  return extractSafeErrorMessage(error);
}

/**
 * Determine the stage from error context
 */
export function determineErrorStage(error: unknown, context?: string): string {
  if (context) return context;

  if (isActorInitTimeout(error)) return 'actor-init-timeout';
  if (isProfileFetchTimeout(error)) return 'profile-fetch-timeout';
  if (isProfileQueryDisabled(error)) return 'profile-query-disabled';
  if (isUserNotRegisteredError(error)) return 'profile-setup-required';
  if (isStoppedCanisterError(error)) return 'backend-unavailable';

  // Check global boot diagnostics
  if (typeof window !== 'undefined' && window.__BOOT_DIAGNOSTICS__) {
    return window.__BOOT_DIAGNOSTICS__.stage;
  }

  return 'unknown';
}

/**
 * Get current boot diagnostics from global state
 */
export function getBootDiagnostics(error?: unknown, context?: string): BootDiagnostics {
  const stage = determineErrorStage(error, context);
  const message = normalizeErrorMessage(error);
  const rawError = error instanceof Error ? error.stack || error.message : String(error);
  
  const diagnostics: BootDiagnostics = {
    stage,
    message,
    rawError,
  };

  // Add build marker and timestamp if available
  if (typeof window !== 'undefined' && window.__BOOT_DIAGNOSTICS__) {
    diagnostics.buildMarker = window.__BOOT_DIAGNOSTICS__.buildMarker;
    diagnostics.timestamp = window.__BOOT_DIAGNOSTICS__.timestamp;
  }

  return diagnostics;
}

/**
 * Create a clipboard-safe payload from boot diagnostics
 */
export function createClipboardPayload(diagnostics: BootDiagnostics): string {
  const lines = [
    `Stage: ${diagnostics.stage}`,
    diagnostics.buildMarker ? `Build: ${diagnostics.buildMarker}` : null,
    diagnostics.timestamp ? `Timestamp: ${new Date(diagnostics.timestamp).toISOString()}` : null,
    '',
    'User-Friendly Message:',
    diagnostics.message,
    '',
    'Raw Error:',
    diagnostics.rawError,
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Log structured boot diagnostics to console
 */
export function logBootDiagnostics(diagnostics: BootDiagnostics, level: 'error' | 'warn' | 'info' = 'error') {
  const logFn = console[level];
  logFn(`[Boot Diagnostics] Stage: ${diagnostics.stage}`);
  if (diagnostics.buildMarker) {
    logFn(`[Boot Diagnostics] Build: ${diagnostics.buildMarker}`);
  }
  logFn(`[Boot Diagnostics] Message: ${diagnostics.message}`);
  logFn(`[Boot Diagnostics] Raw Error:`, diagnostics.rawError);
}
