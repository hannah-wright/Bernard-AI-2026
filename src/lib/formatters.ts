/**
 * Shared formatting utilities for BernardAI
 * These functions are used across multiple components for consistent formatting
 */

/**
 * Format a number as currency with abbreviated suffixes (K, M, B)
 * @param amount - The amount in cents or dollars (depending on usage)
 * @param options - Configuration options
 */
export function formatCurrency(
  amount?: number | null,
  options: { 
    fallback?: string;
    abbreviated?: boolean;
  } = {}
): string {
  const { fallback = 'N/A', abbreviated = true } = options;
  
  if (amount === null || amount === undefined) return fallback;
  
  if (abbreviated) {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${amount}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format cents to dollars for display (used in billing)
 * @param cents - Amount in cents
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format a date string for display
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param dateString - ISO date string
 */
export function formatRelativeDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

/**
 * Format a number with locale-specific separators
 * @param value - The number to format
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format a percentage value
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Escape a value for safe CSV inclusion
 * @param value - The value to escape
 */
export function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

