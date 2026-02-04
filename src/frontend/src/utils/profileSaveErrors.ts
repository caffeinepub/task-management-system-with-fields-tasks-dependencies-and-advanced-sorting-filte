/**
 * Utility to normalize profile save errors into user-friendly messages.
 * Maps backend traps, actor states, and authentication issues to clear English guidance.
 */

export type ProfileSaveErrorCategory = 
  | 'login-required'
  | 'actor-initializing'
  | 'actor-unavailable'
  | 'authorization'
  | 'unknown';

export interface NormalizedProfileSaveError {
  category: ProfileSaveErrorCategory;
  message: string;
}

/**
 * Normalize any profile save error into a user-friendly message.
 */
export function normalizeProfileSaveError(error: unknown): NormalizedProfileSaveError {
  console.log('[ProfileSaveError] Normalizing error:', error);
  
  // Handle explicit error codes from mutation guards
  if (error instanceof Error) {
    const message = error.message;
    
    // Login required
    if (message.startsWith('LOGIN_REQUIRED:')) {
      return {
        category: 'login-required',
        message: 'Please log in with Internet Identity to save your profile.',
      };
    }
    
    // Actor initializing (post-login race)
    if (message.startsWith('ACTOR_INITIALIZING:')) {
      return {
        category: 'actor-initializing',
        message: 'Connection is still initializing. Please wait a moment and try again.',
      };
    }
    
    // Actor unavailable
    if (message.startsWith('ACTOR_UNAVAILABLE:')) {
      return {
        category: 'actor-unavailable',
        message: 'Unable to connect to the backend. Please check your connection and try again.',
      };
    }
    
    // Backend authorization trap
    if (message.toLowerCase().includes('unauthorized') || 
        message.toLowerCase().includes('permission')) {
      return {
        category: 'authorization',
        message: 'You do not have permission to save this profile. Please log in and try again.',
      };
    }
    
    // Anonymous caller trap from backend
    if (message.toLowerCase().includes('anonymous')) {
      return {
        category: 'login-required',
        message: 'Please log in with Internet Identity to save your profile.',
      };
    }
  }
  
  // Handle reject messages from IC
  if (error && typeof error === 'object') {
    const anyError = error as any;
    const rejectMessage = anyError.reject_message || anyError.message || '';
    
    if (rejectMessage.toLowerCase().includes('unauthorized') || 
        rejectMessage.toLowerCase().includes('anonymous')) {
      return {
        category: 'authorization',
        message: 'You do not have permission to save this profile. Please log in and try again.',
      };
    }
  }
  
  // Unknown error
  const fallbackMessage = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred while saving your profile.';
  
  return {
    category: 'unknown',
    message: fallbackMessage,
  };
}
