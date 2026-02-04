import type { DurationUnit } from '../backend';

/**
 * Convert a duration value to minutes based on the unit
 */
export function convertToMinutes(duration: number, unit: DurationUnit): number {
  switch (unit) {
    case 'hours':
      return duration * 60;
    case 'days':
      return duration * 1440; // 24 * 60
    case 'minutes':
    default:
      return duration;
  }
}

/**
 * Convert minutes to a specific duration unit
 */
export function convertFromMinutes(minutes: number, unit: DurationUnit): number {
  switch (unit) {
    case 'hours':
      return Math.round(minutes / 60);
    case 'days':
      return Math.round(minutes / 1440);
    case 'minutes':
    default:
      return minutes;
  }
}

/**
 * Convert a duration from one unit to another, preserving the total minutes
 */
export function convertDurationUnit(
  value: number,
  fromUnit: DurationUnit,
  toUnit: DurationUnit
): number {
  if (fromUnit === toUnit) return value;
  
  // Convert to minutes first, then to target unit
  const totalMinutes = convertToMinutes(value, fromUnit);
  return convertFromMinutes(totalMinutes, toUnit);
}

/**
 * Format a total duration in minutes to a human-readable format
 */
export function formatTotalDuration(durationInMinutes: number): string {
  if (durationInMinutes === 0) return '0 min';
  
  if (durationInMinutes < 60) {
    return `${durationInMinutes} min`;
  } else if (durationInMinutes < 1440) {
    // Use floor division to get hours and remaining minutes
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} min`;
    }
  } else {
    const days = Math.floor(durationInMinutes / 1440);
    const remainingMinutes = durationInMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    let result = `${days} ${days === 1 ? 'day' : 'days'}`;
    if (hours > 0) {
      result += ` ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }
    if (minutes > 0) {
      result += ` ${minutes} min`;
    }
    return result;
  }
}
