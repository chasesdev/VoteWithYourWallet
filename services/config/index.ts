// Export all state configurations by tier
export * from './tier1';
export * from './tier2';
export * from './tier3';
export * from './tier4';

// Export all configurations as a single array for convenience
import { TIER1_STATES } from './tier1';
import { TIER2_STATES } from './tier2';
import { TIER3_STATES } from './tier3';
import { TIER4_STATES } from './tier4';

export const ALL_STATE_CONFIGS = [
  ...TIER1_STATES,
  ...TIER2_STATES,
  ...TIER3_STATES,
  ...TIER4_STATES
];

// Export configuration constants
export { ScrapingConfig } from '../types';