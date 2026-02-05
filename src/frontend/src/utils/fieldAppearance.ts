import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Predefined icon IDs (using lucide-react icon names)
export const PREDEFINED_ICONS = [
  'Briefcase',
  'Home',
  'Heart',
  'Star',
  'Target',
  'Zap',
  'Book',
  'Code',
  'Palette',
  'Music',
  'Camera',
  'Dumbbell',
  'Plane',
  'ShoppingCart',
  'Coffee',
  'Lightbulb',
  'Rocket',
  'Trophy',
  'Leaf',
  'Globe',
] as const;

export type IconId = typeof PREDEFINED_ICONS[number];

// Predefined color palette (simple, distinct colors)
export const PREDEFINED_COLORS = [
  { id: 'blue', label: 'Blue', value: '#3B82F6' },
  { id: 'green', label: 'Green', value: '#10B981' },
  { id: 'red', label: 'Red', value: '#EF4444' },
  { id: 'purple', label: 'Purple', value: '#8B5CF6' },
  { id: 'orange', label: 'Orange', value: '#F97316' },
  { id: 'pink', label: 'Pink', value: '#EC4899' },
  { id: 'yellow', label: 'Yellow', value: '#EAB308' },
  { id: 'teal', label: 'Teal', value: '#14B8A6' },
  { id: 'indigo', label: 'Indigo', value: '#6366F1' },
  { id: 'cyan', label: 'Cyan', value: '#06B6D4' },
] as const;

export type ColorId = typeof PREDEFINED_COLORS[number]['id'];

// Default values for new fields or migration fallback
export const DEFAULT_ICON: IconId = 'Briefcase';
export const DEFAULT_COLOR_ID: ColorId = 'blue';

// Get icon component from icon ID
export function getIconComponent(iconId: string): LucideIcon {
  // Validate and return icon component, fallback to default
  if (iconId in LucideIcons) {
    return (LucideIcons as any)[iconId] as LucideIcon;
  }
  return (LucideIcons as any)[DEFAULT_ICON] as LucideIcon;
}

// Get color value from color ID
export function getColorValue(colorId: string): string {
  const color = PREDEFINED_COLORS.find(c => c.id === colorId);
  return color?.value || PREDEFINED_COLORS.find(c => c.id === DEFAULT_COLOR_ID)!.value;
}

// Get color object from color ID
export function getColorById(colorId: string) {
  return PREDEFINED_COLORS.find(c => c.id === colorId) || PREDEFINED_COLORS.find(c => c.id === DEFAULT_COLOR_ID)!;
}
