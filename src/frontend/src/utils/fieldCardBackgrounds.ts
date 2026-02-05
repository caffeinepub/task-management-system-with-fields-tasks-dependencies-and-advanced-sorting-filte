// Light background color palette for field cards
// Each option has a stable ID, English label, and CSS variable reference

export const FIELD_CARD_BACKGROUNDS = [
  { id: 'white', label: 'White' },
  { id: 'sky', label: 'Sky Blue' },
  { id: 'mint', label: 'Mint Green' },
  { id: 'lavender', label: 'Lavender' },
  { id: 'peach', label: 'Peach' },
  { id: 'lemon', label: 'Lemon' },
  { id: 'rose', label: 'Rose' },
  { id: 'sage', label: 'Sage' },
  { id: 'cream', label: 'Cream' },
  { id: 'blush', label: 'Blush' },
  { id: 'powder', label: 'Powder Blue' },
  { id: 'seafoam', label: 'Seafoam' },
  { id: 'lilac', label: 'Lilac' },
  { id: 'sand', label: 'Sand' },
  { id: 'coral', label: 'Coral' },
  { id: 'ice', label: 'Ice Blue' },
  { id: 'pearl', label: 'Pearl' },
  { id: 'honey', label: 'Honey' },
  { id: 'mist', label: 'Mist' },
  { id: 'champagne', label: 'Champagne' },
] as const;

export type BackgroundColorId = typeof FIELD_CARD_BACKGROUNDS[number]['id'];

// Default background color for new fields
export const DEFAULT_BACKGROUND_ID: BackgroundColorId = 'white';

// Get background color object by ID
export function getBackgroundById(bgId: string) {
  return FIELD_CARD_BACKGROUNDS.find(bg => bg.id === bgId) || FIELD_CARD_BACKGROUNDS.find(bg => bg.id === DEFAULT_BACKGROUND_ID)!;
}

// Get CSS variable name for a background color ID
export function getBackgroundCssVar(bgId: string): string {
  const bg = getBackgroundById(bgId);
  return `var(--field-bg-${bg.id})`;
}
