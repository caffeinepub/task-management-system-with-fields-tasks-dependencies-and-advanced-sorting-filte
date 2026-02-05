/**
 * Utility to normalize export user data errors into user-friendly messages.
 * Handles authentication, actor initialization, authorization, and backend errors.
 */

import { isUserNotRegisteredError, MISSING_PROFILE_MESSAGE } from './bootErrorMessages';

export type ExportErrorCategory = 
  | 'login-required'
  | 'actor-initializing'
  | 'actor-unavailable'
  | 'missing-profile'
  | 'authorization'
  | 'backend'
  | 'network'
  | 'unknown';

export interface NormalizedExportError {
  category: ExportErrorCategory;
  message: string;
}

/**
 * Normalize export user data errors into user-friendly messages.
 */
export function normalizeExportUserDataError(error: unknown): NormalizedExportError {
  // Handle null/undefined
  if (!error) {
    return {
      category: 'unknown',
      message: 'An unexpected error occurred while exporting your data. Please try again.',
    };
  }

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorMessageLower = errorMessage.toLowerCase();

  // 1. Login required (client-side guard)
  if (errorMessage.startsWith('LOGIN_REQUIRED:')) {
    return {
      category: 'login-required',
      message: 'You must log in with Internet Identity to export your data.',
    };
  }

  // 2. Actor initializing (client-side guard)
  if (errorMessage.startsWith('ACTOR_INITIALIZING:')) {
    return {
      category: 'actor-initializing',
      message: 'The connection is still initializing. Please wait a moment and try again.',
    };
  }

  // 3. Actor unavailable (client-side guard)
  if (errorMessage.startsWith('ACTOR_UNAVAILABLE:')) {
    return {
      category: 'actor-unavailable',
      message: 'Unable to connect to the backend. Please check your connection and try again.',
    };
  }

  // 4. Missing profile (backend authorization trap)
  if (isUserNotRegisteredError(error)) {
    return {
      category: 'missing-profile',
      message: MISSING_PROFILE_MESSAGE,
    };
  }

  // 5. Authorization errors (backend traps)
  if (
    errorMessageLower.includes('only users can access') ||
    errorMessageLower.includes('users only') ||
    errorMessageLower.includes('unauthorized') ||
    errorMessageLower.includes('permission')
  ) {
    return {
      category: 'authorization',
      message: 'You do not have permission to export data. Please ensure you are logged in.',
    };
  }

  // 6. Network errors
  if (
    errorMessageLower.includes('network') ||
    errorMessageLower.includes('fetch') ||
    errorMessageLower.includes('timeout') ||
    errorMessageLower.includes('connection')
  ) {
    return {
      category: 'network',
      message: 'Network error occurred while exporting your data. Please check your connection and try again.',
    };
  }

  // 7. Backend errors (canister errors)
  if (
    errorMessageLower.includes('canister') ||
    errorMessageLower.includes('reject') ||
    errorMessageLower.includes('trap')
  ) {
    return {
      category: 'backend',
      message: `Export failed: ${errorMessage}`,
    };
  }

  // 8. Unknown errors
  return {
    category: 'unknown',
    message: `Failed to export data: ${errorMessage}`,
  };
}
