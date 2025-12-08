/**
 * Formatters Unit Tests
 * 
 * Tests for currency, date, and number formatting utilities.
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate, formatPercent, escapeCSV, truncate, formatPrice, formatRelativeDate } from './formatters'

describe('formatCurrency', () => {
  it('formats millions correctly', () => {
    expect(formatCurrency(5000000)).toBe('$5.0M')
    expect(formatCurrency(5500000)).toBe('$5.5M')
    expect(formatCurrency(1000000)).toBe('$1.0M')
  })

  it('formats billions correctly', () => {
    expect(formatCurrency(1000000000)).toBe('$1.0B')
    expect(formatCurrency(2500000000)).toBe('$2.5B')
  })

  it('formats thousands correctly', () => {
    expect(formatCurrency(500000)).toBe('$500K')
    expect(formatCurrency(50000)).toBe('$50K')
    expect(formatCurrency(1000)).toBe('$1K')
  })

  it('handles small numbers', () => {
    expect(formatCurrency(500)).toBe('$500')
    expect(formatCurrency(0)).toBe('$0')
  })

  it('handles null and undefined with fallback', () => {
    expect(formatCurrency(null)).toBe('N/A')
    expect(formatCurrency(undefined)).toBe('N/A')
    expect(formatCurrency(null, { fallback: '$0' })).toBe('$0')
  })
})

describe('formatPrice', () => {
  it('converts cents to dollars', () => {
    expect(formatPrice(5000)).toBe('$50')
    expect(formatPrice(100)).toBe('$1')
    expect(formatPrice(9999)).toBe('$100')
  })
})

describe('formatNumber', () => {
  it('formats large numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('handles zero and small numbers', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })
})

describe('formatDate', () => {
  it('formats dates correctly', () => {
    const date = new Date('2024-06-15T00:00:00')
    const result = formatDate(date)
    expect(result).toContain('Jun')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats ISO string dates', () => {
    const result = formatDate('2024-06-15T00:00:00')
    expect(result).toContain('Jun')
    expect(result).toContain('15')
  })
})

describe('formatRelativeDate', () => {
  it('returns "just now" for recent dates', () => {
    const now = new Date()
    expect(formatRelativeDate(now)).toBe('just now')
  })

  it('returns minutes ago for recent dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeDate(fiveMinAgo)).toBe('5 min ago')
  })

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    expect(formatRelativeDate(twoHoursAgo)).toBe('2h ago')
  })

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeDate(threeDaysAgo)).toBe('3d ago')
  })
})

describe('formatPercent', () => {
  it('formats percentages correctly', () => {
    expect(formatPercent(50)).toBe('50%')
    expect(formatPercent(75)).toBe('75%')
    expect(formatPercent(100)).toBe('100%')
  })

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0%')
  })

  it('handles decimal precision', () => {
    expect(formatPercent(33.333, 1)).toBe('33.3%')
    expect(formatPercent(66.6, 2)).toBe('66.60%')
  })
})

describe('escapeCSV', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeCSV(null)).toBe('')
    expect(escapeCSV(undefined)).toBe('')
  })

  it('returns value as-is for simple strings', () => {
    expect(escapeCSV('hello')).toBe('hello')
    expect(escapeCSV(123)).toBe('123')
  })

  it('escapes commas', () => {
    expect(escapeCSV('hello, world')).toBe('"hello, world"')
  })

  it('escapes quotes', () => {
    expect(escapeCSV('say "hello"')).toBe('"say ""hello"""')
  })

  it('escapes newlines', () => {
    expect(escapeCSV('line1\nline2')).toBe('"line1\nline2"')
  })
})

describe('truncate', () => {
  it('returns full string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello w...')
  })

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

