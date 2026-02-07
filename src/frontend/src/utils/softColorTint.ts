/**
 * Utility to generate fully opaque soft tints from predefined hex colors.
 * Theme-aware: returns different tint strengths for light vs dark mode.
 * Resilient: validates input and falls back to app default color for invalid hex values.
 */

// Default fallback color (app default blue)
const DEFAULT_HEX_COLOR = '#3B82F6';

/**
 * Validate and normalize hex color string
 * Returns normalized hex (with #) or null if invalid
 */
function validateHex(hex: string): string | null {
  // Remove leading # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Check if it's a valid 6-digit hex color
  if (/^[a-f\d]{6}$/i.test(cleanHex)) {
    return `#${cleanHex}`;
  }
  
  return null;
}

/**
 * Convert hex color to RGB components
 * Now returns default color RGB if input is invalid instead of throwing
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const validHex = validateHex(hex);
  const hexToUse = validHex || DEFAULT_HEX_COLOR;
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexToUse);
  if (!result) {
    // This should never happen with our validation, but provide a safe fallback
    console.warn(`Unexpected hex parsing failure for: ${hex}, using default`);
    return { r: 59, g: 130, b: 246 }; // #3B82F6
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Mix a color with white or black to create a fully opaque tint
 * @param hex - Source hex color (e.g., '#3B82F6')
 * @param mixColor - Color to mix with (255 for white, 0 for black)
 * @param strength - Mix strength (0-1, where 0 = full mixColor, 1 = full source color)
 */
function mixColor(hex: string, mixColor: number, strength: number): string {
  const rgb = hexToRgb(hex);
  const mixed = {
    r: rgb.r * strength + mixColor * (1 - strength),
    g: rgb.g * strength + mixColor * (1 - strength),
    b: rgb.b * strength + mixColor * (1 - strength),
  };
  return rgbToHex(mixed.r, mixed.g, mixed.b);
}

/**
 * Generate a soft tint for card backgrounds
 * Light mode: mix with white (very light tint)
 * Dark mode: mix with dark gray (subtle tint)
 * Validates input and uses default color for invalid hex values
 */
export function getSoftCardBackground(hex: string, isDark: boolean): string {
  const validHex = validateHex(hex);
  const hexToUse = validHex || DEFAULT_HEX_COLOR;
  
  if (!validHex) {
    console.warn(`Invalid hex color for card background: "${hex}", using default`);
  }
  
  if (isDark) {
    // Dark mode: mix 8% color with dark background (~#1a1a1a = 26)
    return mixColor(hexToUse, 26, 0.08);
  } else {
    // Light mode: mix 12% color with white
    return mixColor(hexToUse, 255, 0.12);
  }
}

/**
 * Generate a soft tint for icon chip backgrounds
 * Light mode: mix with white (light tint, more visible than card)
 * Dark mode: mix with dark gray (more visible than card)
 * Validates input and uses default color for invalid hex values
 */
export function getSoftIconChipBackground(hex: string, isDark: boolean): string {
  const validHex = validateHex(hex);
  const hexToUse = validHex || DEFAULT_HEX_COLOR;
  
  if (!validHex) {
    console.warn(`Invalid hex color for icon chip background: "${hex}", using default`);
  }
  
  if (isDark) {
    // Dark mode: mix 15% color with dark background
    return mixColor(hexToUse, 26, 0.15);
  } else {
    // Light mode: mix 20% color with white
    return mixColor(hexToUse, 255, 0.20);
  }
}
