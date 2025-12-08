/**
 * Test Utilities
 * 
 * Reusable test helpers and wrappers for all tests.
 */

import React, { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Create a new query client for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

interface WrapperProps {
  children: ReactNode
}

// Provider wrapper for tests
function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function with providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export const mockStartup = (overrides = {}) => ({
  id: 'test-startup-1',
  name: 'Test Startup',
  slug: 'test-startup',
  description: 'A test startup for testing',
  eli5: 'A simple explanation',
  website: 'https://test.com',
  logo: '/logo.png',
  sector: ['AI/ML', 'SaaS'],
  location: { city: 'San Francisco', country: 'United States' },
  fundingRound: { type: 'Seed' as const, amount: 5000000, date: '2024-01-01' },
  metrics: { buzzScore: 75, estimatedRevenue: '$1M ARR' },
  dataSources: [{ name: 'TechCrunch', confidence: 'high' as const }],
  lastUpdated: '2024-01-01',
  founders: [{ name: 'John Doe', title: 'CEO' }],
  hasPriorExit: false,
  isHot: true,
  unicornLikelihoodScore: 65,
  backerQualityScore: 70,
  isHiddenGem: false,
  ...overrides,
})

export const mockProfile = (overrides = {}) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  credits_remaining: 100,
  subscription_tier: 'growth',
  onboarding_completed_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const mockOrganization = (overrides = {}) => ({
  id: 'test-org-1',
  name: 'Test Org',
  owner_id: 'test-user-1',
  subscription_tier: 'growth',
  max_members: 3,
  ...overrides,
})

