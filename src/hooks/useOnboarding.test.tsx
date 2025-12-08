/**
 * useOnboarding Hook Tests
 * 
 * Tests for onboarding state management and completion logic.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOnboarding } from './useOnboarding'

// Mock useProfile
const mockProfile = vi.fn()

vi.mock('./useProfile', () => ({
  useProfile: () => mockProfile(),
}))

describe('useOnboarding', () => {
  it('returns needsOnboarding=true when onboarding not completed', () => {
    mockProfile.mockReturnValue({
      profile: { 
        id: 'test-1', 
        onboarding_completed_at: null,
      },
      loading: false,
    })

    const { result } = renderHook(() => useOnboarding())
    
    expect(result.current.needsOnboarding).toBe(true)
    expect(result.current.isOnboardingComplete).toBe(false)
  })

  it('returns needsOnboarding=false when onboarding completed', () => {
    mockProfile.mockReturnValue({
      profile: { 
        id: 'test-1', 
        onboarding_completed_at: '2024-01-01T00:00:00Z',
      },
      loading: false,
    })

    const { result } = renderHook(() => useOnboarding())
    
    expect(result.current.needsOnboarding).toBe(false)
    expect(result.current.isOnboardingComplete).toBe(true)
  })

  it('returns needsOnboarding=false when loading', () => {
    mockProfile.mockReturnValue({
      profile: null,
      loading: true,
    })

    const { result } = renderHook(() => useOnboarding())
    
    expect(result.current.needsOnboarding).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })

  it('returns needsOnboarding=falsy when no profile (not logged in)', () => {
    mockProfile.mockReturnValue({
      profile: null,
      loading: false,
    })

    const { result } = renderHook(() => useOnboarding())
    
    // When no profile exists, needsOnboarding is falsy (user not logged in)
    expect(result.current.needsOnboarding).toBeFalsy()
  })

  it('tracks current step correctly', () => {
    mockProfile.mockReturnValue({
      profile: { 
        id: 'test-1', 
        onboarding_completed_at: null,
        onboarding_step: 3,
      },
      loading: false,
    })

    const { result } = renderHook(() => useOnboarding())
    
    expect(result.current.currentStep).toBe(3)
  })

  it('defaults to step 0 when no step saved', () => {
    mockProfile.mockReturnValue({
      profile: { 
        id: 'test-1', 
        onboarding_completed_at: null,
        onboarding_step: undefined,
      },
      loading: false,
    })

    const { result } = renderHook(() => useOnboarding())
    
    expect(result.current.currentStep).toBe(0)
  })
})

