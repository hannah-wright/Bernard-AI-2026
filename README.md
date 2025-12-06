# BernardAI - Startup VC Intelligence Platform

A VC-focused startup intelligence SaaS platform built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Payments**: Stripe (subscriptions, one-time purchases)
- **Data Pipeline**: Zyte API (web scraping), Google Gemini AI (enrichment)

## Project Structure

```
src/
├── components/
│   ├── billing/          # Upgrade modals, CSV export CTA
│   ├── dashboard/        # Startup grid, cards, filters, hero
│   ├── layout/           # Header, navigation
│   └── ui/               # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx       # Authentication context
│   ├── useBilling.tsx    # Subscription management
│   ├── useCredits.tsx    # Credit deduction logic
│   ├── useProfile.tsx    # User profile context
│   └── useStartups.tsx   # Startup data fetching
├── pages/
│   ├── Index.tsx         # Main dashboard
│   ├── Auth.tsx          # Login/signup with invite codes
│   └── Billing.tsx       # Subscription management
├── integrations/
│   └── supabase/         # Supabase client & types
└── config/
    └── billing.ts        # Plan definitions, credit costs

supabase/
├── functions/
│   ├── scrape-startups/  # 2x daily data scraping
│   ├── enrich-startup/   # AI-powered data enrichment
│   ├── create-checkout/  # Stripe checkout sessions
│   ├── stripe-webhook/   # Payment event handling
│   ├── deduct-credits/   # Server-side credit deduction
│   └── ...               # Other edge functions
└── config.toml           # Supabase configuration
```

## Key Features

### Authentication
- Invite code required for signup (no public registration)
- Email confirmation flow with resend functionality
- Protected profile fields (credits, subscription tier)

### Credit System
- 1 credit per startup detail view
- 5 credits for CSV export
- Server-side deduction via `deduct_user_credits` RPC
- Low credit warnings at ≤50 and ≤10 credits

### Startup Data
- Pagination: 20 startups per page with "Load More"
- Blurred overlay for unauthenticated users (after 4th startup)
- Three card tabs: Market (default), Predictive AI, Team
- Bootstrapped startups exempt from date-based filtering

### Filters
- Geography (country, city)
- Business Model (B2B/B2C, target customer)
- Team & Signal (founder type, FAANG alumni, prior exits)
- Capital Efficiency (funding bands, runway, burn multiple)
- Sectors (AI/ML, Fintech, Healthcare, etc.)
- Funding Type (Bootstrapped listed first)

## Database Schema

### Core Tables
- `profiles` - User data with credits and subscription tier
- `startups` - Company data with VC intelligence fields
- `funding_rounds` - Funding history per startup
- `favorites` - User bookmarks with notes
- `invite_codes` - Single-use signup codes
- `credit_transactions` - Usage logging

### Security
- RLS policies on all tables
- `secure_profile_update` trigger protects billing fields
- `admin_update_profile` RPC for server-side updates
- Service role required for credit operations

## Environment Variables

### Required Secrets (Supabase Edge Functions)
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ZYTE_API_KEY
GEMINI_API_KEY          # Get free at https://aistudio.google.com/app/apikey
```

### AI Enrichment (Free Option)
The startup enrichment uses **Google Gemini API** which offers a generous free tier:
- **Free**: 15 requests/minute, 1 million tokens/day
- **Fast**: Gemini 1.5 Flash is optimized for speed
- **Reliable**: Google's infrastructure

Get your free API key at: https://aistudio.google.com/app/apikey

## Development

### Prerequisites
- Node.js 18+
- npm or bun

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Edge Function Development
Edge functions are deployed automatically when code is pushed. Functions are located in `supabase/functions/`.

## Data Pipeline

### Scraping (2x daily: 8am/8pm PST)
1. `scrape-startups` function runs via cron
2. Sources: TechCrunch, VentureBeat, Startups.gallery, etc.
3. Uses Zyte API for automatic data extraction
4. Detects new startups and funding round updates

### Enrichment
1. `enrich-startup` function processes new/updated startups
2. Uses **Google Gemini 1.5 Flash** for VC intelligence analysis (free tier available)
3. Generates: team scores, unicorn probability, PMF score
4. Populates: founder background, traction, unit economics
5. Fallback: Can use Lovable AI if LOVABLE_API_KEY is set instead

## Billing Integration

### Subscription Tiers
| Plan | Monthly Credits | Price |
|------|-----------------|-------|
| Starter | 500 | $249/mo |
| Growth | 1,000 | $499/mo |
| Scale | 1,800 | $899/mo |

### Stripe Events Handled
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Credit pack purchases

## Important Patterns

### Protected Profile Updates
The `enforce_secure_profile_update` trigger prevents direct modification of `credits_remaining` and `subscription_tier`. All billing operations must use:
```sql
SELECT admin_update_profile(user_id, new_credits, new_tier);
```

### Credit Deduction
```typescript
const { success, creditsRemaining } = await deductCredits('view_startup', {
  description: 'Viewed startup details',
  resourceId: startupId
});
```

### Edge Function Auth Pattern
```typescript
// Get fresh session to avoid stale tokens
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;

// Use service role for admin operations
const serviceClient = createClient(supabaseUrl, serviceRoleKey);
await serviceClient.rpc('admin_update_profile', { ... });
```

## Design System

Uses HSL color tokens defined in `src/index.css`:
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`

Typography: Libre Baskerville for headers, Geist Sans for body.

## Deployment

- **Frontend**: Lovable (auto-deploys on push)
- **Backend**: Supabase Edge Functions (auto-deploys)
- **Vercel**: Use `vercel.json` for SPA routing

## License

Proprietary - All rights reserved.
