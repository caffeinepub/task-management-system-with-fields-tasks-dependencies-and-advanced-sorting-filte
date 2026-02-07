/**
 * Pre-React bootstrap module that ensures required globals are available
 * before any other modules execute, preventing ReferenceError crashes.
 * Emits a minimal boot banner with environment and build information.
 */

// Define global boot diagnostics marker
interface BootDiagnostics {
  stage: string;
  buildMarker: string;
  timestamp: number;
}

declare global {
  interface Window {
    __BOOT_DIAGNOSTICS__?: BootDiagnostics;
  }
}

// Initialize boot diagnostics
const buildMarker = `build-${Date.now()}`;
window.__BOOT_DIAGNOSTICS__ = {
  stage: 'pre-react-init',
  buildMarker,
  timestamp: Date.now(),
};

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

// Emit minimal boot banner
const env = import.meta.env?.MODE || 'unknown';
console.log(`[Bootstrap] Pre-React globals initialized | env: ${env} | build: ${buildMarker}`);

// Update stage
window.__BOOT_DIAGNOSTICS__.stage = 'pre-react-ready';

// Import and setup boot fallback error handlers
import './bootFallback';
