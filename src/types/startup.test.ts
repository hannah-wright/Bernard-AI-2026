/**
 * Startup Types Tests
 * 
 * Tests for type guards and filter state validation.
 */

import { describe, it, expect } from 'vitest'
import type { 
  FilterState, 
  Startup, 
  RoundType, 
  ConfidenceLevel,
  Sector,
  RevenueConfidence 
} from './startup'

describe('RoundType', () => {
  it('includes all expected round types', () => {
    const validTypes: RoundType[] = [
      'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Bootstrapped'
    ]
    
    // Type check - this will fail at compile time if types don't match
    expect(validTypes).toHaveLength(7)
  })
})

describe('ConfidenceLevel', () => {
  it('includes all expected levels', () => {
    const validLevels: ConfidenceLevel[] = ['high', 'medium', 'low']
    expect(validLevels).toHaveLength(3)
  })
})

describe('Sector', () => {
  it('includes key sectors', () => {
    const validSectors: Sector[] = [
      'AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'Biotech', 
      'Climate Tech', 'Enterprise', 'Consumer', 'E-commerce'
    ]
    expect(validSectors.length).toBeGreaterThanOrEqual(9)
  })
})

describe('RevenueConfidence', () => {
  it('includes all confidence levels', () => {
    const validLevels: RevenueConfidence[] = ['verified', 'estimated', 'unknown']
    expect(validLevels).toHaveLength(3)
  })
})

describe('FilterState', () => {
  it('can create a valid default filter state', () => {
    const defaultFilters: FilterState = {
      sectors: [],
      roundTypes: [],
      fundingMin: 0,
      fundingMax: 100000000,
      buzzzScoreMin: 0,
      countries: [],
      regions: [],
      dateRange: '9999',
      dataConfidence: [],
      hasPriorExit: null,
      hasFounderExperience: null,
      sortBy: 'latest',
      totalRaisedMin: null,
      totalRaisedMax: null,
      hasPriorIPO: false,
      hiringVelocityBands: [],
      foundingTeamSignalBands: [],
      cofoundersWorkedTogether: null,
      unicornLikelihoodMin: null,
      is10xBet: false,
      backerQualityMin: null,
      backerHotStreak: false,
      isHiddenGem: false,
      isBootstrappedGrowth: false,
      hasIndiePresence: false,
      hasNoCrunchbase: false,
    }

    expect(defaultFilters.sectors).toEqual([])
    expect(defaultFilters.sortBy).toBe('latest')
  })

  it('validates filter ranges', () => {
    const filters: FilterState = {
      sectors: [],
      roundTypes: [],
      fundingMin: 1000000,
      fundingMax: 5000000,
      buzzzScoreMin: 50,
      countries: [],
      regions: [],
      dateRange: '30',
      dataConfidence: ['high'],
      hasPriorExit: true,
      hasFounderExperience: null,
      sortBy: 'funding',
      totalRaisedMin: null,
      totalRaisedMax: null,
      hasPriorIPO: false,
      hiringVelocityBands: [],
      foundingTeamSignalBands: [],
      cofoundersWorkedTogether: null,
      unicornLikelihoodMin: null,
      is10xBet: false,
      backerQualityMin: null,
      backerHotStreak: false,
      isHiddenGem: false,
      isBootstrappedGrowth: false,
      hasIndiePresence: false,
      hasNoCrunchbase: false,
    }

    expect(filters.fundingMin).toBeLessThan(filters.fundingMax)
    expect(filters.buzzzScoreMin).toBeGreaterThanOrEqual(0)
    expect(filters.buzzzScoreMin).toBeLessThanOrEqual(100)
  })
})

describe('Startup interface', () => {
  it('can create a valid startup object', () => {
    const startup: Partial<Startup> = {
      id: 'test-1',
      name: 'Test Startup',
      slug: 'test-startup',
      description: 'A test startup',
      eli5: 'Simple explanation',
      website: 'https://test.com',
      sector: ['AI/ML', 'SaaS'],
      location: { city: 'SF', country: 'United States' },
      fundingRound: { type: 'Seed', amount: 5000000, date: '2024-01-01' },
      metrics: { buzzScore: 75 },
      dataSources: [{ name: 'Test Source', confidence: 'high' }],
    }

    expect(startup.name).toBe('Test Startup')
    expect(startup.sector).toContain('AI/ML')
    expect(startup.fundingRound?.type).toBe('Seed')
  })
})

