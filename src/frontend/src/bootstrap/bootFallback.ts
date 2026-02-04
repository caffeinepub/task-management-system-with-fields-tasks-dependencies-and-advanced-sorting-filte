/**
 * Boot fallback infrastructure that displays user-friendly error messages
 * when the application fails to start before React can mount.
 */

interface BootError {
  message: string;
  stack?: string;
  cause?: any;
}

let errorDisplayed = false;

function displayBootError(error: BootError) {
  // Prevent multiple error displays
  if (errorDisplayed) return;
  errorDisplayed = true;

  // Log detailed error to console
  console.error('[Boot Error] Application failed to start:', error);
  if (error.stack) {
    console.error('[Boot Error] Stack trace:', error.stack);
  }
  if (error.cause) {
    console.error('[Boot Error] Cause:', error.cause);
  }

  // Get or create root container
  const root = document.getElementById('root');
  if (!root) {
    console.error('[Boot Error] Root container not found');
    return;
  }

  // Create fallback UI with consistent messaging
  root.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
    ">
      <div style="
        max-width: 32rem;
        width: 100%;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        text-align: center;
      ">
        <div style="
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1.5rem;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg style="width: 2rem; height: 2rem; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 style="
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.75rem;
        ">
          Application Error Occurred
        </h1>
        
        <p style="
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.5;
        ">
          An unexpected error occurred while starting the application.
        </p>
        
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: none;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
          width: 100%;
        " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
          Retry
        </button>
        
        <p style="
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
        ">
          If the problem persists, please try logging out and back in.
        </p>
      </div>
    </div>
  `;
}

// Register global error handlers
window.addEventListener('error', (event) => {
  displayBootError({
    message: event.message || 'Unknown error',
    stack: event.error?.stack,
    cause: event.error?.cause,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  displayBootError({
    message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
    stack: event.reason?.stack,
    cause: event.reason?.cause,
  });
});

console.log('[Bootstrap] Boot fallback handlers registered');
