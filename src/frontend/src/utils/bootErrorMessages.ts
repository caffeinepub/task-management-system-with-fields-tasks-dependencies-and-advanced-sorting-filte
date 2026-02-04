/**
 * Checks if an error is the "User is not registered" condition
 */
export function isUserNotRegisteredError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('user is not registered') || 
           message.includes('not registered');
  }
  
  if (typeof error === 'string') {
    return error.toLowerCase().includes('user is not registered') ||
           error.toLowerCase().includes('not registered');
  }
  
  return false;
}

/**
 * Normalizes unknown actor/boot errors into user-friendly English messages
 */
export function normalizeBootError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred while starting the application.';
  }

  // Check for "User is not registered" - this should not be shown as a boot error
  // but if it somehow reaches here, provide a clear message
  if (isUserNotRegisteredError(error)) {
    return 'Please complete your profile setup to continue.';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for common error patterns
    if (message.includes('actor not available') || message.includes('actor creation')) {
      return 'Unable to connect to the backend service. Please check your connection.';
    }
    
    if (message.includes('unauthorized') || message.includes('permission')) {
      return 'Authentication failed. Your session may have expired.';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (message.includes('timeout')) {
      return 'Connection timed out. The service may be temporarily unavailable.';
    }
    
    if (message.includes('canister') && message.includes('not found')) {
      return 'Backend service not found. Please contact support.';
    }
    
    // Return the original error message if it's reasonably short and user-friendly
    if (error.message && error.message.length < 150 && !error.message.includes('stack')) {
      return error.message;
    }
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred while starting the application.';
}
