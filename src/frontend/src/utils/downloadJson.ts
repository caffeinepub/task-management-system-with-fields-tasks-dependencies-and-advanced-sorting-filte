/**
 * Utility to download a JavaScript object as a JSON file.
 * Creates a Blob, generates an object URL, and triggers a download.
 * Handles BigInt serialization and provides error handling.
 */

/**
 * Custom JSON replacer that converts BigInt to string for serialization.
 */
function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Download a JavaScript object as a JSON file.
 * @param data - The data to export as JSON
 * @param filename - Optional filename (defaults to taskmanager-export-YYYY-MM-DD.json)
 * @throws Error if serialization or download fails
 */
export function downloadJson(data: unknown, filename?: string): void {
  try {
    // Generate default filename with ISO date if not provided
    const defaultFilename = `taskmanager-export-${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;

    // Convert data to JSON string with pretty formatting and BigInt handling
    const jsonString = JSON.stringify(data, bigIntReplacer, 2);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();

    // Clean up - use setTimeout to ensure download starts before cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('[downloadJson] Failed to generate download:', error);
    throw new Error('Failed to generate download file. Please try again.');
  }
}
