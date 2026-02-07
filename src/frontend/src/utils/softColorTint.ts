/**
 * Utility to generate fully opaque soft tints from predefined hex colors.
 * Theme-aware: returns different tint strengths for light vs dark mode.
 */

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
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
 */
export function getSoftCardBackground(hex: string, isDark: boolean): string {
  if (isDark) {
    // Dark mode: mix 8% color with dark background (~#1a1a1a = 26)
    return mixColor(hex, 26, 0.08);
  } else {
    // Light mode: mix 12% color with white
    return mixColor(hex, 255, 0.12);
  }
}

/**
 * Generate a soft tint for icon chip backgrounds
 * Light mode: mix with white (light tint, more visible than card)
 * Dark mode: mix with dark gray (more visible than card)
 */
export function getSoftIconChipBackground(hex: string, isDark: boolean): string {
  if (isDark) {
    // Dark mode: mix 15% color with dark background
    return mixColor(hex, 26, 0.15);
  } else {
    // Light mode: mix 20% color with white
    return mixColor(hex, 255, 0.20);
  }
}
