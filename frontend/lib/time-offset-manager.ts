// Time offset configuration manager

export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours' | 'custom';

export interface TimeOffsetConfig {
  preset?: OffsetPreset;
  customMinutes?: number;
  description?: string;
}

export function validateOffsetConfig(config: TimeOffsetConfig): { valid: boolean; error?: string } {
  if (!config) return { valid: false, error: 'Config is required' };
  
  const validPresets = ['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'custom'];
  
  if (config.preset && !validPresets.includes(config.preset)) {
    return { valid: false, error: `Invalid preset. Must be one of: ${validPresets.join(', ')}` };
  }
  
  if (config.customMinutes !== undefined) {
    if (config.customMinutes < 1 || config.customMinutes > 720) {
      return { valid: false, error: 'Custom minutes must be between 1 and 720' };
    }
  }
  
  return { valid: true };
}

export function offsetConfigToMinutes(config: TimeOffsetConfig): number {
  if (config.customMinutes) return config.customMinutes;
  
  switch (config.preset) {
    case '30min': return 30;
    case '1hour': return 60;
    case '2hours': return 120;
    case '4hours': return 240;
    case '6hours': return 360;
    case '12hours': return 720;
    case 'custom': return config.customMinutes || 120;
    default: return 120; // Default 2 hours
  }
}
