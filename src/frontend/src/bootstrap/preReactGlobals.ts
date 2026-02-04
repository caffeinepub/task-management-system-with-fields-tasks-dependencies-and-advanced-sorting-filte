/**
 * Pre-React bootstrap module that ensures required globals are available
 * before any other modules execute, preventing ReferenceError crashes.
 */

// Define process and process.env shims for browser environment
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
  } as any;
}

// Ensure process.env exists
if (!globalThis.process.env) {
  globalThis.process.env = {};
}

// Map Vite environment variables if available
if (typeof import.meta !== 'undefined' && import.meta.env) {
  Object.keys(import.meta.env).forEach((key) => {
    if (key.startsWith('VITE_')) {
      globalThis.process.env[key] = import.meta.env[key];
    }
  });
}

// Define global as globalThis if not already defined
if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// Import and setup boot fallback error handlers
import './bootFallback';

console.log('[Bootstrap] Pre-React globals initialized');
