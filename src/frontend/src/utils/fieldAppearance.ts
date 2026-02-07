import type { LucideIcon } from 'lucide-react';
import { LUCIDE_ICON_MAP, FALLBACK_ICON } from './lucideIconMap';

// Predefined icon IDs (using lucide-react icon names) - 100 hand-picked icons
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
  'Smartphone',
  'Laptop',
  'Headphones',
  'Gamepad',
  'Film',
  'Tv',
  'Radio',
  'Mic',
  'Video',
  'Image',
  'FileText',
  'Folder',
  'Archive',
  'Bookmark',
  'Tag',
  'Calendar',
  'Clock',
  'Timer',
  'AlarmClock',
  'Bell',
  'Mail',
  'MessageCircle',
  'Phone',
  'Users',
  'User',
  'UserPlus',
  'Shield',
  'Lock',
  'Key',
  'Settings',
  'Wrench',
  'Hammer',
  'Scissors',
  'Pen',
  'Pencil',
  'Edit',
  'Trash',
  'Download',
  'Upload',
  'Share',
  'Link',
  'ExternalLink',
  'Search',
  'Filter',
  'Menu',
  'Grid',
  'List',
  'Layout',
  'Layers',
  'Package',
  'Box',
  'Gift',
  'ShoppingBag',
  'CreditCard',
  'DollarSign',
  'TrendingUp',
  'TrendingDown',
  'BarChart',
  'PieChart',
  'Activity',
  'Cpu',
  'Database',
  'Server',
  'Cloud',
  'Wifi',
  'Bluetooth',
  'Battery',
  'Power',
  'Sun',
  'Moon',
  'CloudRain',
  'Wind',
  'Umbrella',
  'Mountain',
  'Trees',
  'Flower',
  'Sprout',
  'Apple',
  'Pizza',
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

/**
 * Safe icon resolver: returns the icon component if valid, null if not found.
 * Uses the explicit icon map to ensure production builds work correctly.
 */
export function safeGetIconComponent(iconId: string): LucideIcon | null {
  return LUCIDE_ICON_MAP[iconId] || null;
}

/**
 * Get icon component from icon ID (with fallback to default).
 * Uses the explicit icon map to ensure production builds work correctly.
 */
export function getIconComponent(iconId: string): LucideIcon {
  const component = LUCIDE_ICON_MAP[iconId];
  if (component) return component;
  
  // Fallback to default icon
  return LUCIDE_ICON_MAP[DEFAULT_ICON] || FALLBACK_ICON;
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
