/**
 * Utility to normalize field creation errors and provide user-friendly messages
 */

export type ErrorCategory = 'login-required' | 'actor-initializing' | 'actor-unavailable' | 'authorization' | 'unknown';

export interface NormalizedError {
  message: string;
  category: ErrorCategory;
}

/**
 * Normalizes field creation errors into user-friendly messages
 */
export function normalizeFieldCreationError(error: unknown): NormalizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for login-required / anonymous / guest errors
  if (
    errorMessage.includes('LOGIN_REQUIRED') ||
    errorMessage.includes('Anonymous users') ||
    errorMessage.includes('guest mode') ||
    errorMessage.includes('Login required') ||
    errorMessage.toLowerCase().includes('anonymous') && errorMessage.toLowerCase().includes('persistent')
  ) {
    return {
      message: 'You must log in with Internet Identity to create Fields.',
      category: 'login-required',
    };
  }
  
  // Check for actor initializing (readiness race)
  if (errorMessage.includes('ACTOR_INITIALIZING') || errorMessage.includes('still initializing')) {
    return {
      message: 'The connection is still initializing. Please wait a moment and try again.',
      category: 'actor-initializing',
    };
  }
  
  // Check if actor is not available
  if (errorMessage.includes('ACTOR_UNAVAILABLE') || errorMessage.includes('Actor not available')) {
    return {
      message: 'Unable to connect to the backend. Please check your connection and try again.',
      category: 'actor-unavailable',
    };
  }
  
  // Check for authorization-related errors (permission issues after login)
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('permissions') ||
    errorMessage.includes('user permissions') ||
    errorMessage.includes('not authorized')
  ) {
    return {
      message: 'Authorization failed. Please log out and log in again to refresh your permissions.',
      category: 'authorization',
    };
  }
  
  // Check for auth context not ready
  if (errorMessage.includes('Authentication context not ready')) {
    return {
      message: 'Authentication is still initializing. Please wait a moment and try again.',
      category: 'actor-initializing',
    };
  }
  
  // Unknown error - include the underlying message for debugging
  return {
    message: `Failed to create field: ${errorMessage}`,
    category: 'unknown',
  };
}
