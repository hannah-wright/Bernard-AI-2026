// BernardAI Billing Configuration
// All prices are in cents

export const TRIAL_CONFIG = {
  credits: 50,
  savedFilters: 0,
  users: 4, // Owner + 3 invited team members
  features: ['50 credits (one-time)', 'Invite up to 3 team members', 'No saved filters'],
} as const;

export const FREE_CONFIG = {
  credits: 0,
  savedFilters: 0,
  users: 4, // Owner + 3 invited team members
  features: ['Limited access', 'Invite up to 3 team members'],
} as const;

export const BILLING_CONFIG = {
  // Subscription Plans
  plans: {
    starter: {
      name: 'Starter',
      monthlyCredits: 500,
      users: 1,
      savedFilters: 0,
      features: ['500 credits/month', '1 user', 'No saved filters'],
      monthly: {
        productId: 'prod_TXoPZKDe4a3oSG',
        priceId: 'price_1SaimKA3QDciZJOqUXzTZPuY',
        price: 24900, // $249
      },
      annual: {
        productId: 'prod_TXoPssn5zCmlc5',
        priceId: 'price_1SaimXA3QDciZJOqCYlcfedD',
        price: 254100, // $2,541 (15% off)
        monthlyEquivalent: 21175, // ~$211.75/mo
      },
      overageRate: 60, // $0.60 per credit
    },
    growth: {
      name: 'Growth',
      monthlyCredits: 1000,
      users: 3,
      savedFilters: 3,
      features: ['1,000 credits/month', '3 users', '3 saved filters', 'CSV export'],
      monthly: {
        productId: 'prod_TXoPYwpa9g662R',
        priceId: 'price_1SaimhA3QDciZJOq8UCrfIB8',
        price: 49900, // $499
      },
      annual: {
        productId: 'prod_TXoPBxijSeRR6U',
        priceId: 'price_1SaimuA3QDciZJOq9DeO1tbe',
        price: 508980, // $5,089.80 (15% off)
        monthlyEquivalent: 42415, // ~$424.15/mo
      },
      overageRate: 55, // $0.55 per credit
    },
    scale: {
      name: 'Scale',
      monthlyCredits: 1800,
      users: -1, // unlimited
      savedFilters: -1, // unlimited
      features: ['1,800 credits/month', 'Unlimited users', 'Unlimited filters', 'CSV export', 'Priority support'],
      monthly: {
        productId: 'prod_TXoPCC5z4kbhda',
        priceId: 'price_1Sain8A3QDciZJOqbFA3KWj4',
        price: 89900, // $899
      },
      annual: {
        productId: 'prod_TXoQm30KS0qUD7',
        priceId: 'price_1SainJA3QDciZJOqRwmcpMVH',
        price: 916980, // $9,169.80 (15% off)
        monthlyEquivalent: 76415, // ~$764.15/mo
      },
      overageRate: 50, // $0.50 per credit
    },
  },

  // One-off Credit Packs (priced higher to incentivize plan upgrades)
  creditPacks: {
    pack100: {
      name: '100 Credits',
      credits: 100,
      productId: 'prod_TXoQJTtrJbmR7W',
      priceId: 'price_1SainXA3QDciZJOqHDDO9Xkl',
      price: 7500, // $75 ($0.75/credit)
      perCredit: 75,
    },
    pack250: {
      name: '250 Credits',
      credits: 250,
      productId: 'prod_TXoQVlFqdFX8dd',
      priceId: 'price_1SainiA3QDciZJOqojxEmbNv',
      price: 17500, // $175 ($0.70/credit)
      perCredit: 70,
    },
    pack500: {
      name: '500 Credits',
      credits: 500,
      productId: 'prod_TXoQFuxAlRQXYa',
      priceId: 'price_1SaintA3QDciZJOq32OQf7VK',
      price: 32500, // $325 ($0.65/credit)
      perCredit: 65,
    },
  },

  // Annual discount percentage
  annualDiscount: 15,
} as const;

export type PlanKey = keyof typeof BILLING_CONFIG.plans;
export type CreditPackKey = keyof typeof BILLING_CONFIG.creditPacks;

// Helper to get plan by product ID
export function getPlanByProductId(productId: string): { plan: PlanKey; isAnnual: boolean } | null {
  for (const [key, plan] of Object.entries(BILLING_CONFIG.plans)) {
    if (plan.monthly.productId === productId) {
      return { plan: key as PlanKey, isAnnual: false };
    }
    if (plan.annual.productId === productId) {
      return { plan: key as PlanKey, isAnnual: true };
    }
  }
  return null;
}

// Format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Check if subscription tier is a paid plan
export function isPaidPlan(tier: string | null | undefined): boolean {
  if (!tier) return false;
  return ['starter', 'growth', 'scale'].includes(tier.toLowerCase());
}

// Check if subscription tier is trial
export function isTrialPlan(tier: string | null | undefined): boolean {
  return tier?.toLowerCase() === 'trial';
}

// Check if user can access alerts (paid users only)
export function canAccessAlerts(tier: string | null | undefined): boolean {
  return isPaidPlan(tier);
}

// Check if user can export CSV (growth+ plans)
export function canExportCsv(tier: string | null | undefined): boolean {
  if (!tier) return false;
  return ['growth', 'scale'].includes(tier.toLowerCase());
}

// Get saved filters limit for a tier
export function getSavedFiltersLimit(tier: string | null | undefined): number {
  if (!tier || tier.toLowerCase() === 'free' || tier.toLowerCase() === 'trial') {
    return 0; // Free/Trial: no saved filters
  }
  const plan = BILLING_CONFIG.plans[tier.toLowerCase() as PlanKey];
  return plan?.savedFilters ?? 0;
}

// Check if user has unlimited saved filters (scale plan)
export function hasUnlimitedSavedFilters(tier: string | null | undefined): boolean {
  return getSavedFiltersLimit(tier) === -1;
}
