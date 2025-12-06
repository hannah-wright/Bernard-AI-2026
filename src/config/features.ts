/**
 * Feature Flags System
 * 
 * This provides a simple feature flag mechanism for safe rollouts.
 * Features can be enabled/disabled based on:
 * - Environment (development/production)
 * - User roles
 * - Subscription tier
 * 
 * To add a new feature:
 * 1. Add it to the FEATURES object
 * 2. Use `isFeatureEnabled('featureName')` or `useFeatureFlag('featureName')` hook
 */

import { useProfile } from '@/hooks/useProfile';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import type { PlanKey } from '@/config/billing';

// ============================================================================
// Feature Definitions
// ============================================================================

export interface FeatureConfig {
  /** Feature identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this feature does */
  description: string;
  /** Is the feature currently enabled globally */
  enabled: boolean;
  /** Minimum plan required (null = available to all) */
  minPlan?: PlanKey | null;
  /** Only available in development mode */
  devOnly?: boolean;
  /** Percentage of users who should see this feature (0-100) */
  rolloutPercentage?: number;
}

/**
 * All feature flags for BernardAI
 */
export const FEATURES: Record<string, FeatureConfig> = {
  // -------------------------------------------------------------------------
  // Core Features
  // -------------------------------------------------------------------------
  csvExport: {
    id: 'csvExport',
    name: 'CSV Export',
    description: 'Allow users to export startup data as CSV',
    enabled: true,
    minPlan: 'growth',
  },
  
  alerts: {
    id: 'alerts',
    name: 'Alerts & Notifications',
    description: 'Email and Slack notifications for new startups matching filters',
    enabled: true,
    minPlan: 'starter',
  },
  
  savedFilters: {
    id: 'savedFilters',
    name: 'Saved Filters',
    description: 'Allow users to save and reuse filter presets',
    enabled: true,
    minPlan: null, // Available to trial users too
  },
  
  apiAccess: {
    id: 'apiAccess',
    name: 'API Access',
    description: 'Programmatic access to startup data',
    enabled: true,
    minPlan: 'scale',
  },

  // -------------------------------------------------------------------------
  // Experimental Features (for gradual rollout)
  // -------------------------------------------------------------------------
  aiChatAssistant: {
    id: 'aiChatAssistant',
    name: 'AI Chat Assistant',
    description: 'Chat with AI to find startups matching specific criteria',
    enabled: false,
    devOnly: true,
    rolloutPercentage: 0,
  },
  
  startupComparison: {
    id: 'startupComparison',
    name: 'Startup Comparison',
    description: 'Compare multiple startups side by side',
    enabled: false,
    devOnly: true,
    rolloutPercentage: 0,
  },
  
  portfolioTracking: {
    id: 'portfolioTracking',
    name: 'Portfolio Tracking',
    description: 'Track investments and portfolio companies',
    enabled: false,
    devOnly: true,
    rolloutPercentage: 0,
  },

  // -------------------------------------------------------------------------
  // Infrastructure Features
  // -------------------------------------------------------------------------
  debugMode: {
    id: 'debugMode',
    name: 'Debug Mode',
    description: 'Show additional debugging information',
    enabled: false,
    devOnly: true,
  },
  
  performanceMetrics: {
    id: 'performanceMetrics',
    name: 'Performance Metrics',
    description: 'Log performance metrics to console',
    enabled: false,
    devOnly: true,
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

const isDevelopment = import.meta.env.DEV;

/**
 * Plan hierarchy for comparison
 */
const PLAN_HIERARCHY: Record<string, number> = {
  trial: 0,
  free: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

/**
 * Check if user's plan meets minimum requirement
 */
function meetsPlanRequirement(userPlan: string | null, minPlan: PlanKey | null): boolean {
  if (!minPlan) return true; // No minimum required
  if (!userPlan) return false; // User has no plan
  
  const userLevel = PLAN_HIERARCHY[userPlan.toLowerCase()] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[minPlan.toLowerCase()] ?? 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Deterministic hash for consistent rollout percentages
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Check if a feature is enabled (basic check without user context)
 */
export function isFeatureEnabled(featureId: keyof typeof FEATURES): boolean {
  const feature = FEATURES[featureId];
  if (!feature) return false;
  
  // Check if feature is globally disabled
  if (!feature.enabled) return false;
  
  // Check if dev-only feature in production
  if (feature.devOnly && !isDevelopment) return false;
  
  return true;
}

/**
 * Check if a feature is enabled for a specific user
 */
export function isFeatureEnabledForUser(
  featureId: keyof typeof FEATURES,
  options: {
    userId?: string | null;
    userPlan?: string | null;
    isAdmin?: boolean;
  } = {}
): boolean {
  const feature = FEATURES[featureId];
  if (!feature) return false;
  
  // Admins always have access to all features
  if (options.isAdmin) return true;
  
  // Basic enabled check
  if (!isFeatureEnabled(featureId)) return false;
  
  // Check plan requirement
  if (feature.minPlan && !meetsPlanRequirement(options.userPlan || null, feature.minPlan)) {
    return false;
  }
  
  // Check rollout percentage
  if (feature.rolloutPercentage !== undefined && feature.rolloutPercentage < 100) {
    if (!options.userId) return false;
    const userHash = hashUserId(options.userId);
    if (userHash >= feature.rolloutPercentage) return false;
  }
  
  return true;
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * Hook to check if a feature is enabled for the current user
 */
export function useFeatureFlag(featureId: keyof typeof FEATURES): boolean {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { subscription } = useBilling();
  
  // Determine user's plan from profile or subscription
  const userPlan = subscription.plan || profile?.subscription_tier;
  
  return isFeatureEnabledForUser(featureId, {
    userId: user?.id,
    userPlan,
    isAdmin: false, // TODO: Add admin check if you have user roles
  });
}

/**
 * Hook to get all enabled features for the current user
 */
export function useEnabledFeatures(): string[] {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { subscription } = useBilling();
  
  const userPlan = subscription.plan || profile?.subscription_tier;
  
  return Object.keys(FEATURES).filter(featureId => 
    isFeatureEnabledForUser(featureId as keyof typeof FEATURES, {
      userId: user?.id,
      userPlan,
      isAdmin: false,
    })
  );
}

