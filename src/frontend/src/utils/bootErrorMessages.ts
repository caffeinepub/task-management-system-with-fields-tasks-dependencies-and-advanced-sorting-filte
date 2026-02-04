/**
 * Extracts text from nested IC error structures
 */
function extractErrorText(error: unknown): string {
  if (!error) return '';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle IC reject structures (nested objects)
  if (typeof error === 'object') {
    const anyError = error as any;
    
    // Common IC error fields to check
    const fields = [
      'reject_message',
      'message',
      'error_message',
      'error',
      'description',
    ];
    
    for (const field of fields) {
      if (anyError[field]) {
        const value = anyError[field];
        // Recursively extract if nested
        if (typeof value === 'string') {
          return value;
        } else if (typeof value === 'object') {
          const nested = extractErrorText(value);
          if (nested) return nested;
        }
      }
    }
    
    // Try stringifying the object to search within it
    try {
      const stringified = JSON.stringify(error);
      return stringified;
    } catch {
      return String(error);
    }
  }
  
  return String(error);
}

/**
 * Checks if an error is the "User is not registered" condition
 * Searches across all common IC error field structures
 */
export function isUserNotRegisteredError(error: unknown): boolean {
  if (!error) return false;
  
  const errorText = extractErrorText(error).toLowerCase();
  
  // Check for the specific phrase in any form
  return errorText.includes('user is not registered') || 
         errorText.includes('not registered');
}

/**
 * Extracts a safe, user-friendly message from an error without exposing raw IC error blobs
 */
export function extractSafeErrorMessage(error: unknown): string {
  const errorText = extractErrorText(error);
  
  // If it's a known "User is not registered" error, return friendly message
  if (isUserNotRegisteredError(error)) {
    return 'Please complete your profile setup to continue.';
  }
  
  // For other errors, extract just the meaningful part (avoid raw blobs)
  // Look for trap messages which are usually after "Canister trapped:"
  const trapMatch = errorText.match(/Canister trapped:\s*(.+?)(?:\n|$)/i);
  if (trapMatch && trapMatch[1]) {
    return trapMatch[1].trim();
  }
  
  // If error text is reasonably short and doesn't look like a blob, use it
  if (errorText.length < 200 && !errorText.includes('{') && !errorText.includes('stack')) {
    return errorText;
  }
  
  // Fallback to generic message
  return 'An unexpected error occurred.';
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

  const errorText = extractErrorText(error).toLowerCase();
  
  // Check for common error patterns
  if (errorText.includes('actor not available') || errorText.includes('actor creation')) {
    return 'Unable to connect to the backend service. Please check your connection.';
  }
  
  if (errorText.includes('unauthorized') || errorText.includes('permission')) {
    return 'Authentication failed. Your session may have expired.';
  }
  
  if (errorText.includes('network') || errorText.includes('fetch') || errorText.includes('failed to fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  if (errorText.includes('timeout')) {
    return 'Connection timed out. The service may be temporarily unavailable.';
  }
  
  if (errorText.includes('canister') && errorText.includes('not found')) {
    return 'Backend service not found. Please contact support.';
  }
  
  // Use the safe extraction method
  return extractSafeErrorMessage(error);
}
