/**
 * Billing Configuration Tests
 * 
 * Tests for billing plans, credit costs, and feature access.
 */

import { describe, it, expect } from 'vitest'
import { 
  BILLING_CONFIG, 
  TRIAL_CONFIG,
  FREE_CONFIG,
  getSavedFiltersLimit,
  hasUnlimitedCredits,
  isPaidPlan,
  isTrialPlan,
  canAccessAlerts,
  canExportCsv,
  formatPrice,
  getPlanByProductId,
} from './billing'

describe('BILLING_CONFIG', () => {
  it('has all required plan tiers', () => {
    expect(BILLING_CONFIG.plans).toHaveProperty('starter')
    expect(BILLING_CONFIG.plans).toHaveProperty('growth')
    expect(BILLING_CONFIG.plans).toHaveProperty('scale')
  })

  it('has credit packs', () => {
    expect(BILLING_CONFIG.creditPacks).toHaveProperty('pack100')
    expect(BILLING_CONFIG.creditPacks).toHaveProperty('pack250')
    expect(BILLING_CONFIG.creditPacks).toHaveProperty('pack500')
  })

  it('starter plan has expected values', () => {
    const starter = BILLING_CONFIG.plans.starter
    expect(starter.monthlyCredits).toBe(500)
    expect(starter.monthly.price).toBeGreaterThan(0)
    expect(starter.savedFilters).toBe(0)
    expect(starter.users).toBe(1)
  })

  it('growth plan has more features than starter', () => {
    const starter = BILLING_CONFIG.plans.starter
    const growth = BILLING_CONFIG.plans.growth
    
    expect(growth.monthlyCredits).toBeGreaterThan(starter.monthlyCredits)
    expect(growth.savedFilters).toBeGreaterThan(starter.savedFilters)
    expect(growth.users).toBeGreaterThan(starter.users)
  })

  it('scale plan has unlimited credits', () => {
    const scale = BILLING_CONFIG.plans.scale
    expect(scale.monthlyCredits).toBe(-1) // -1 means unlimited
    expect(scale.savedFilters).toBe(-1) // unlimited
    expect(scale.users).toBe(-1) // unlimited
  })
})

describe('TRIAL_CONFIG and FREE_CONFIG', () => {
  it('trial has correct credits', () => {
    expect(TRIAL_CONFIG.credits).toBe(50)
    expect(TRIAL_CONFIG.users).toBe(4) // Owner + 3 team members
    expect(TRIAL_CONFIG.savedFilters).toBe(0)
  })

  it('free has limited access', () => {
    expect(FREE_CONFIG.credits).toBe(0)
    expect(FREE_CONFIG.users).toBe(4)
    expect(FREE_CONFIG.savedFilters).toBe(0)
  })
})

describe('isPaidPlan', () => {
  it('returns true for paid plans', () => {
    expect(isPaidPlan('starter')).toBe(true)
    expect(isPaidPlan('growth')).toBe(true)
    expect(isPaidPlan('scale')).toBe(true)
  })

  it('returns false for non-paid plans', () => {
    expect(isPaidPlan('free')).toBe(false)
    expect(isPaidPlan('trial')).toBe(false)
    expect(isPaidPlan(null)).toBe(false)
    expect(isPaidPlan(undefined)).toBe(false)
  })
})

describe('isTrialPlan', () => {
  it('returns true for trial', () => {
    expect(isTrialPlan('trial')).toBe(true)
    expect(isTrialPlan('TRIAL')).toBe(true)
  })

  it('returns false for other plans', () => {
    expect(isTrialPlan('starter')).toBe(false)
    expect(isTrialPlan('free')).toBe(false)
    expect(isTrialPlan(null)).toBe(false)
  })
})

describe('canAccessAlerts', () => {
  it('paid plans can access alerts', () => {
    expect(canAccessAlerts('starter')).toBe(true)
    expect(canAccessAlerts('growth')).toBe(true)
    expect(canAccessAlerts('scale')).toBe(true)
  })

  it('free/trial cannot access alerts', () => {
    expect(canAccessAlerts('free')).toBe(false)
    expect(canAccessAlerts('trial')).toBe(false)
    expect(canAccessAlerts(null)).toBe(false)
  })
})

describe('canExportCsv', () => {
  it('growth+ can export CSV', () => {
    expect(canExportCsv('growth')).toBe(true)
    expect(canExportCsv('scale')).toBe(true)
  })

  it('starter/free cannot export CSV', () => {
    expect(canExportCsv('starter')).toBe(false)
    expect(canExportCsv('free')).toBe(false)
    expect(canExportCsv(null)).toBe(false)
  })
})

describe('formatPrice', () => {
  it('formats cents to dollars', () => {
    expect(formatPrice(24900)).toBe('$249')
    expect(formatPrice(100)).toBe('$1')
    expect(formatPrice(49900)).toBe('$499')
  })
})

describe('getPlanByProductId', () => {
  it('finds monthly plans', () => {
    const result = getPlanByProductId('prod_TXoPZKDe4a3oSG')
    expect(result).toEqual({ plan: 'starter', isAnnual: false })
  })

  it('finds annual plans', () => {
    const result = getPlanByProductId('prod_TXoPssn5zCmlc5')
    expect(result).toEqual({ plan: 'starter', isAnnual: true })
  })

  it('returns null for unknown product', () => {
    expect(getPlanByProductId('unknown')).toBeNull()
  })
})

describe('getSavedFiltersLimit', () => {
  it('returns 0 for free/trial/starter', () => {
    expect(getSavedFiltersLimit('free')).toBe(0)
    expect(getSavedFiltersLimit('trial')).toBe(0)
    expect(getSavedFiltersLimit('starter')).toBe(0)
  })

  it('returns 3 for growth', () => {
    expect(getSavedFiltersLimit('growth')).toBe(3)
  })

  it('returns -1 (unlimited) for scale', () => {
    expect(getSavedFiltersLimit('scale')).toBe(-1)
  })

  it('handles null/undefined', () => {
    expect(getSavedFiltersLimit(null)).toBe(0)
    expect(getSavedFiltersLimit(undefined)).toBe(0)
  })

  it('is case insensitive', () => {
    expect(getSavedFiltersLimit('GROWTH')).toBe(3)
    expect(getSavedFiltersLimit('Growth')).toBe(3)
  })
})

describe('hasUnlimitedCredits', () => {
  it('returns true for scale plan', () => {
    expect(hasUnlimitedCredits('scale')).toBe(true)
    expect(hasUnlimitedCredits('SCALE')).toBe(true)
  })

  it('returns false for other plans', () => {
    expect(hasUnlimitedCredits('starter')).toBe(false)
    expect(hasUnlimitedCredits('growth')).toBe(false)
    expect(hasUnlimitedCredits('free')).toBe(false)
    expect(hasUnlimitedCredits(null)).toBe(false)
    expect(hasUnlimitedCredits(undefined)).toBe(false)
  })
})

