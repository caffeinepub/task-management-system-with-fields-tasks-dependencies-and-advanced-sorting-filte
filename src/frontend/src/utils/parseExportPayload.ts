import { Principal } from '@dfinity/principal';
import { DurationUnit } from '../backend';
import type { ExportPayload, Field, Task } from '../backend';
import { DEFAULT_ICON, DEFAULT_COLOR_ID } from './fieldAppearance';

/**
 * Parse and validate an exported JSON payload.
 * Converts BigInt-like string fields back into BigInt and Principal strings back into Principal instances.
 * @param json - The parsed JSON object from the file
 * @returns Validated ExportPayload with proper types
 * @throws Error if validation fails
 */
export function parseExportPayload(json: unknown): ExportPayload {
  // Basic structure validation
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid export file: Expected an object');
  }

  const data = json as Record<string, unknown>;

  if (!Array.isArray(data.fields)) {
    throw new Error('Invalid export file: Missing or invalid "fields" array');
  }

  if (!Array.isArray(data.tasks)) {
    throw new Error('Invalid export file: Missing or invalid "tasks" array');
  }

  // Parse and validate fields
  const fields: Field[] = data.fields.map((field, index) => {
    if (!field || typeof field !== 'object') {
      throw new Error(`Invalid field at index ${index}: Expected an object`);
    }

    const f = field as Record<string, unknown>;

    // Validate required string fields
    if (typeof f.id !== 'string' || !f.id) {
      throw new Error(`Invalid field at index ${index}: Missing or invalid "id"`);
    }
    if (typeof f.name !== 'string') {
      throw new Error(`Invalid field at index ${index}: Missing or invalid "name"`);
    }

    // Parse icon and color with defaults for older exports
    const icon = typeof f.icon === 'string' ? f.icon : DEFAULT_ICON;
    const color = typeof f.color === 'string' ? f.color : DEFAULT_COLOR_ID;

    // Parse Principal
    let createdBy: Principal;
    try {
      createdBy = typeof f.createdBy === 'string' 
        ? Principal.fromText(f.createdBy)
        : f.createdBy as Principal;
    } catch (error) {
      throw new Error(`Invalid field at index ${index}: Invalid "createdBy" Principal`);
    }

    // Parse BigInt fields
    const parseBigInt = (value: unknown, fieldName: string): bigint => {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'string') return BigInt(value);
      if (typeof value === 'number') return BigInt(value);
      throw new Error(`Invalid field at index ${index}: Invalid "${fieldName}" (expected number/string/bigint)`);
    };

    return {
      id: f.id,
      name: f.name,
      icon,
      color,
      createdBy,
      createdAt: parseBigInt(f.createdAt, 'createdAt'),
      avgUrgency: parseBigInt(f.avgUrgency, 'avgUrgency'),
      avgValue: parseBigInt(f.avgValue, 'avgValue'),
      avgInterest: parseBigInt(f.avgInterest, 'avgInterest'),
      avgInfluence: parseBigInt(f.avgInfluence, 'avgInfluence'),
      totalActiveTaskDuration: parseBigInt(f.totalActiveTaskDuration, 'totalActiveTaskDuration'),
      totalTaskDuration: parseBigInt(f.totalTaskDuration, 'totalTaskDuration'),
      taskCount: parseBigInt(f.taskCount, 'taskCount'),
      totalTaskCount: parseBigInt(f.totalTaskCount, 'totalTaskCount'),
    };
  });

  // Parse and validate tasks
  const tasks: Task[] = data.tasks.map((task, index) => {
    if (!task || typeof task !== 'object') {
      throw new Error(`Invalid task at index ${index}: Expected an object`);
    }

    const t = task as Record<string, unknown>;

    // Validate required string fields
    if (typeof t.id !== 'string' || !t.id) {
      throw new Error(`Invalid task at index ${index}: Missing or invalid "id"`);
    }
    if (typeof t.fieldId !== 'string' || !t.fieldId) {
      throw new Error(`Invalid task at index ${index}: Missing or invalid "fieldId"`);
    }
    if (typeof t.name !== 'string') {
      throw new Error(`Invalid task at index ${index}: Missing or invalid "name"`);
    }

    // Parse Principal
    let createdBy: Principal;
    try {
      createdBy = typeof t.createdBy === 'string' 
        ? Principal.fromText(t.createdBy)
        : t.createdBy as Principal;
    } catch (error) {
      throw new Error(`Invalid task at index ${index}: Invalid "createdBy" Principal`);
    }

    // Parse BigInt fields
    const parseBigInt = (value: unknown, fieldName: string): bigint => {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'string') return BigInt(value);
      if (typeof value === 'number') return BigInt(value);
      throw new Error(`Invalid task at index ${index}: Invalid "${fieldName}" (expected number/string/bigint)`);
    };

    // Validate and parse durationUnit
    let durationUnit: DurationUnit;
    if (typeof t.durationUnit !== 'string') {
      throw new Error(`Invalid task at index ${index}: Invalid "durationUnit" (expected string)`);
    }
    
    // Map string to DurationUnit enum
    switch (t.durationUnit) {
      case 'minutes':
        durationUnit = DurationUnit.minutes;
        break;
      case 'hours':
        durationUnit = DurationUnit.hours;
        break;
      case 'days':
        durationUnit = DurationUnit.days;
        break;
      default:
        throw new Error(`Invalid task at index ${index}: Invalid "durationUnit" value "${t.durationUnit}" (expected minutes/hours/days)`);
    }

    // Validate dependencies array
    if (!Array.isArray(t.dependencies)) {
      throw new Error(`Invalid task at index ${index}: Invalid "dependencies" (expected array)`);
    }
    const dependencies = t.dependencies.map((dep, depIndex) => {
      if (typeof dep !== 'string') {
        throw new Error(`Invalid task at index ${index}: Invalid dependency at index ${depIndex} (expected string)`);
      }
      return dep;
    });

    // Validate completed boolean
    if (typeof t.completed !== 'boolean') {
      throw new Error(`Invalid task at index ${index}: Invalid "completed" (expected boolean)`);
    }

    return {
      id: t.id,
      fieldId: t.fieldId,
      name: t.name,
      urgency: parseBigInt(t.urgency, 'urgency'),
      value: parseBigInt(t.value, 'value'),
      interest: parseBigInt(t.interest, 'interest'),
      influence: parseBigInt(t.influence, 'influence'),
      duration: parseBigInt(t.duration, 'duration'),
      durationUnit,
      dependencies,
      createdBy,
      createdAt: parseBigInt(t.createdAt, 'createdAt'),
      completed: t.completed,
    };
  });

  return { fields, tasks };
}
