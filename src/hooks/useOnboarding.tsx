/**
 * useOnboarding Hook
 * 
 * Manages onboarding state and determines if user should see onboarding flow.
 */

import { useProfile } from './useProfile';

export function useOnboarding() {
  const { profile, loading } = useProfile();

  // User needs onboarding if:
  // 1. Profile exists (logged in)
  // 2. No onboarding_completed_at timestamp
  const needsOnboarding = !loading && profile && !profile.onboarding_completed_at;

  // Current onboarding step (for resume functionality)
  const currentStep = profile?.onboarding_step || 0;

  // Check if onboarding is complete
  const isOnboardingComplete = !!profile?.onboarding_completed_at;

  return {
    needsOnboarding,
    currentStep,
    isOnboardingComplete,
    isLoading: loading,
  };
}

