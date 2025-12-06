// BernardAI Shared Constants
// This file contains all shared constants used across the frontend and edge functions
// To keep edge functions in sync, they should import from a shared location or use these values

/**
 * Credit costs for different user actions
 * Used in: useCredits hook, deduct-credits edge function
 */
export const ACTION_COSTS = {
  view_startup_details: 1,
  export_csv: 5,
  api_call: 1,
} as const;

export type CreditAction = keyof typeof ACTION_COSTS;

/**
 * Credit thresholds for warnings and modals
 */
export const CREDIT_THRESHOLDS = {
  /** Show upgrade modal when credits drop to this percentage of monthly allocation */
  lowPercentThreshold: 20,
  /** Show critical warning toast at this absolute number */
  criticalThreshold: 10,
} as const;

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  /** Default credits for new trial users via invite code */
  defaultCredits: 50,
  /** Features available in trial */
  features: ['50 credits (one-time)', '3 saved filters', 'No alerts/notifications'],
} as const;

/**
 * Plan credits by Stripe product ID
 * Used in: stripe-webhook edge function
 */
export const PLAN_CREDITS_BY_PRODUCT = {
  'prod_TXoPZKDe4a3oSG': 500,   // Starter Monthly
  'prod_TXoPssn5zCmlc5': 500,   // Starter Annual
  'prod_TXoPYwpa9g662R': 1000,  // Growth Monthly
  'prod_TXoPBxijSeRR6U': 1000,  // Growth Annual
  'prod_TXoPCC5z4kbhda': 1800,  // Scale Monthly
  'prod_TXoQm30KS0qUD7': 1800,  // Scale Annual
} as const;

/**
 * Credit pack amounts by Stripe product ID
 * Used in: stripe-webhook edge function
 */
export const CREDIT_PACKS_BY_PRODUCT = {
  'prod_TXoQJTtrJbmR7W': 100,   // 100 Credit Pack
  'prod_TXoQVlFqdFX8dd': 250,   // 250 Credit Pack
  'prod_TXoQFuxAlRQXYa': 500,   // 500 Credit Pack
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION = {
  /** Number of startups per page */
  pageSize: 20,
  /** Maximum results for unauthenticated users */
  unauthenticatedLimit: 4,
} as const;

/**
 * API refresh intervals (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  /** How often to refresh subscription status */
  subscription: 60000, // 1 minute
} as const;

/**
 * Date filter options
 */
export const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: '9999', label: 'All time' },
] as const;

export const DATE_ADDED_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
] as const;

/**
 * Cancellation reason options for billing
 */
export const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found an alternative' },
  { value: 'temporary_pause', label: 'Just need a temporary break' },
  { value: 'other', label: 'Other reason' },
] as const;

