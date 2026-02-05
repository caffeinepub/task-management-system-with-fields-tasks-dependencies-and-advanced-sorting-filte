/**
 * Boot fallback infrastructure with enhanced diagnostics that displays user-friendly error messages
 * when the application fails to start before React can mount, including sanitized error details,
 * expandable stack/cause information, and a copy-to-clipboard action.
 */

interface BootError {
  message: string;
  stack?: string;
  cause?: any;
}

let errorDisplayed = false;
let reactRenderStarted = false;

// Export function to mark React render as started (called synchronously during App.tsx module evaluation)
export function markReactRenderStarted() {
  reactRenderStarted = true;
  console.log('[Bootstrap] React render started, boot fallback disabled');
}

function sanitizeText(text: string): string {
  // Truncate very long messages to prevent UI overflow
  const maxLength = 500;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

function displayBootError(error: BootError) {
  // Don't display if React has started rendering
  if (reactRenderStarted) {
    console.log('[Boot Error] React already rendering, skipping fallback UI');
    return;
  }

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

  // Sanitize error details
  const sanitizedMessage = sanitizeText(error.message || 'Unknown error');
  const sanitizedStack = error.stack ? sanitizeText(error.stack) : null;
  const sanitizedCause = error.cause ? sanitizeText(String(error.cause)) : null;

  // Build plain-text payload for copying
  const copyPayload = [
    'Error Message:',
    sanitizedMessage,
    sanitizedStack ? '\n\nStack Trace:\n' + sanitizedStack : '',
    sanitizedCause ? '\n\nCause:\n' + sanitizedCause : '',
  ].filter(Boolean).join('\n');

  // Create fallback UI with enhanced diagnostics
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    max-width: 40rem;
    width: 100%;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    text-align: center;
  `;

  // Icon
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1.5rem;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  iconContainer.innerHTML = `
    <svg style="width: 2rem; height: 2rem; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `;

  // Title
  const title = document.createElement('h1');
  title.style.cssText = `
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.75rem;
  `;
  title.textContent = 'Application Error Occurred';

  // Description
  const description = document.createElement('p');
  description.style.cssText = `
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.5;
  `;
  description.textContent = 'An unexpected error occurred while starting the application.';

  // Error message box
  const errorBox = document.createElement('div');
  errorBox.style.cssText = `
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: left;
  `;

  const errorLabel = document.createElement('div');
  errorLabel.style.cssText = `
    font-size: 0.75rem;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `;
  errorLabel.textContent = 'Error Details';

  const errorText = document.createElement('div');
  errorText.style.cssText = `
    font-size: 0.875rem;
    color: #7f1d1d;
    font-family: ui-monospace, monospace;
    word-break: break-word;
  `;
  errorText.textContent = sanitizedMessage;

  errorBox.appendChild(errorLabel);
  errorBox.appendChild(errorText);

  // Details section (expandable)
  let detailsExpanded = false;
  const detailsSection = document.createElement('div');
  detailsSection.style.cssText = `
    margin-bottom: 1.5rem;
  `;

  if (sanitizedStack || sanitizedCause) {
    const detailsToggle = document.createElement('button');
    detailsToggle.style.cssText = `
      background: transparent;
      border: none;
      color: #3b82f6;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
      margin-right: auto;
    `;
    detailsToggle.innerHTML = `
      <span id="details-text">Show Details</span>
      <svg id="details-icon" style="width: 1rem; height: 1rem; transition: transform 0.2s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;

    const detailsContent = document.createElement('div');
    detailsContent.id = 'details-content';
    detailsContent.style.cssText = `
      display: none;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      text-align: left;
      max-height: 300px;
      overflow-y: auto;
    `;

    if (sanitizedStack) {
      const stackLabel = document.createElement('div');
      stackLabel.style.cssText = `
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      `;
      stackLabel.textContent = 'Stack Trace:';

      const stackText = document.createElement('pre');
      stackText.style.cssText = `
        font-size: 0.75rem;
        color: #6b7280;
        font-family: ui-monospace, monospace;
        white-space: pre-wrap;
        word-break: break-word;
        margin-bottom: 1rem;
      `;
      stackText.textContent = sanitizedStack;

      detailsContent.appendChild(stackLabel);
      detailsContent.appendChild(stackText);
    }

    if (sanitizedCause) {
      const causeLabel = document.createElement('div');
      causeLabel.style.cssText = `
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      `;
      causeLabel.textContent = 'Cause:';

      const causeText = document.createElement('pre');
      causeText.style.cssText = `
        font-size: 0.75rem;
        color: #6b7280;
        font-family: ui-monospace, monospace;
        white-space: pre-wrap;
        word-break: break-word;
      `;
      causeText.textContent = sanitizedCause;

      detailsContent.appendChild(causeLabel);
      detailsContent.appendChild(causeText);
    }

    detailsToggle.onclick = () => {
      detailsExpanded = !detailsExpanded;
      const icon = document.getElementById('details-icon');
      const text = document.getElementById('details-text');
      const content = document.getElementById('details-content');
      
      if (detailsExpanded) {
        content!.style.display = 'block';
        text!.textContent = 'Hide Details';
        icon!.style.transform = 'rotate(180deg)';
      } else {
        content!.style.display = 'none';
        text!.textContent = 'Show Details';
        icon!.style.transform = 'rotate(0deg)';
      }
    };

    detailsSection.appendChild(detailsToggle);
    detailsSection.appendChild(detailsContent);
  }

  // Copy button
  const copyButton = document.createElement('button');
  copyButton.style.cssText = `
    background: #f3f4f6;
    color: #374151;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
    width: 100%;
    margin-bottom: 0.75rem;
  `;
  copyButton.textContent = 'Copy error details';
  copyButton.onmouseover = () => {
    copyButton.style.background = '#e5e7eb';
  };
  copyButton.onmouseout = () => {
    copyButton.style.background = '#f3f4f6';
  };
  copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(copyPayload);
      copyButton.textContent = '✓ Copied to clipboard';
      copyButton.style.background = '#d1fae5';
      copyButton.style.color = '#065f46';
      copyButton.style.borderColor = '#6ee7b7';
      setTimeout(() => {
        copyButton.textContent = 'Copy error details';
        copyButton.style.background = '#f3f4f6';
        copyButton.style.color = '#374151';
        copyButton.style.borderColor = '#d1d5db';
      }, 2000);
    } catch (err) {
      console.error('[Boot Error] Failed to copy to clipboard:', err);
      copyButton.textContent = '✗ Copy failed';
      copyButton.style.background = '#fee2e2';
      copyButton.style.color = '#991b1b';
      copyButton.style.borderColor = '#fecaca';
      setTimeout(() => {
        copyButton.textContent = 'Copy error details';
        copyButton.style.background = '#f3f4f6';
        copyButton.style.color = '#374151';
        copyButton.style.borderColor = '#d1d5db';
      }, 2000);
    }
  };

  // Retry button
  const retryButton = document.createElement('button');
  retryButton.style.cssText = `
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
  `;
  retryButton.textContent = 'Retry';
  retryButton.onmouseover = () => {
    retryButton.style.background = '#2563eb';
  };
  retryButton.onmouseout = () => {
    retryButton.style.background = '#3b82f6';
  };
  retryButton.onclick = () => {
    window.location.reload();
  };

  // Help text
  const helpText = document.createElement('p');
  helpText.style.cssText = `
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: #9ca3af;
  `;
  helpText.textContent = 'If the problem persists, please try logging out and back in.';

  // Assemble card
  card.appendChild(iconContainer);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(errorBox);
  card.appendChild(detailsSection);
  card.appendChild(copyButton);
  card.appendChild(retryButton);
  card.appendChild(helpText);

  container.appendChild(card);
  root.innerHTML = '';
  root.appendChild(container);
}

// Register global error handlers
window.addEventListener('error', (event) => {
  // Only handle if React hasn't started rendering yet
  if (!reactRenderStarted) {
    displayBootError({
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      cause: event.error?.cause,
    });
  } else {
    // Log but don't override React app
    console.error('[Runtime Error] Error after React render started:', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Only handle if React hasn't started rendering yet
  if (!reactRenderStarted) {
    displayBootError({
      message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      cause: event.reason?.cause,
    });
  } else {
    // Log but don't override React app
    console.error('[Runtime Error] Unhandled rejection after React render started:', event.reason);
  }
});

console.log('[Bootstrap] Boot fallback handlers registered');
