# Gemini API Integration Guide

## Overview

BernardAI uses **multiple data sources** to provide comprehensive startup intelligence:

1. **Web Scraping (Zyte API)** - Primary data collection from TechCrunch, Crunchbase, IndieHackers, StarterStory, Product Hunt, EU-Startups, Sifted, Startups.gallery, and more
2. **Google Gemini 2.0 Flash** - AI-powered enrichment and analysis of scraped data
3. **Direct API integrations** - LinkedIn, Crunchbase API (where available)

**This document specifically covers the Gemini 2.0 Flash integration** for AI enrichment. For scraping configuration, see `SCRAPING_SOURCES.md`.

## Data Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DISCOVERY (Zyte Scraping)                                   │
│     - TechCrunch, Crunchbase News, IndieHackers, StarterStory   │
│     - Product Hunt, EU-Startups, Sifted, Startups.gallery       │
│     - Finds new startups + basic info (name, description, etc.) │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. DEEP SCRAPING (Zyte)                                        │
│     - Scrapes startup websites, LinkedIn, news articles         │
│     - Finds: revenue mentions, team info, funding details       │
│     - Can find VERIFIED revenue from founder interviews/posts   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. AI ENRICHMENT (Gemini 2.0 Flash)                            │
│     - Analyzes scraped data + its training knowledge            │
│     - Generates: scores, predictions, team analysis             │
│     - Fills gaps with ESTIMATED data (marked as such)           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Point:** Zyte scraping can find **verified** data (actual revenue from interviews, hiring posts, etc.). Gemini fills in gaps with **estimated** data. The `revenue_confidence` field distinguishes between them.

## Model Configuration

**Model Used:** `gemini-2.0-flash` (NOT experimental)

**API Endpoint:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}
```

**Important:** Do NOT use:
- `gemini-1.5-flash` (older model)
- `gemini-2.0-flash-exp` (experimental, may be unstable)

## Supabase Edge Function Setup

### 1. Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 2. Set Edge Function Secret

In Supabase Dashboard:
1. Go to **Edge Functions** → **enrich-startup**
2. Click **Secrets** tab
3. Add secret: `GEMINI_API_KEY` = your key

**Note:** Each Edge Function has its own secrets. If you create a new function (like `bulk-enrich`), you must set the secret again for that function.

### 3. Function Code Pattern

```typescript
// Correct API call pattern for Gemini 2.0 Flash
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json', // Forces JSON output
      },
    }),
  }
)
```

### 4. Response Parsing

```typescript
const data = await response.json()
const content = data.candidates?.[0]?.content?.parts?.[0]?.text

// Clean markdown code blocks if present
let jsonStr = content.trim()
if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
jsonStr = jsonStr.trim()

return JSON.parse(jsonStr)
```

## Testing the Integration

### Via SQL (pg_net)

```sql
-- Test enrichment function
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/enrich-startup',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
  body := '{"enrichAll": true, "batchSize": 3}'::jsonb
) AS request_id;

-- Wait ~15 seconds, then check response
SELECT status_code, content::text 
FROM net._http_response 
WHERE id = <request_id>;
```

### Expected Response

```json
{
  "success": true,
  "message": "Enrichment complete",
  "provider": "Google Gemini 2.0 Flash",
  "stats": {
    "total": 3,
    "enriched": 3,
    "errors": 0,
    "verifiedRevenue": 0,
    "estimatedRevenue": 3
  },
  "details": [
    {"name": "Startup1", "status": "success", "revenue_confidence": "estimated"},
    {"name": "Startup2", "status": "success", "revenue_confidence": "estimated"},
    {"name": "Startup3", "status": "success", "revenue_confidence": "verified"}
  ]
}
```

### Expected Timing

- **Per startup:** ~3-4 seconds (Gemini API call)
- **3 startups:** ~10-12 seconds total
- **50 startups:** ~3-4 minutes

## Troubleshooting

### Issue: "No response from Gemini" / Fast failures

**Symptoms:**
- Function completes in <500ms for multiple startups
- All startups show "failed" status

**Causes & Solutions:**

1. **Wrong model name**
   - ❌ `gemini-1.5-flash`
   - ❌ `gemini-2.0-flash-exp`
   - ✅ `gemini-2.0-flash`

2. **Missing API key**
   - Check: Edge Functions → [function] → Secrets → GEMINI_API_KEY
   - Each function needs its own secret set

3. **Invalid API key**
   - Get new key from https://aistudio.google.com/app/apikey
   - Ensure key has Generative Language API enabled

### Issue: 401 Unauthorized

**Cause:** Edge Function requires JWT but none provided

**Solution:** Either:
- Pass anon key in Authorization header
- Or set `verify_jwt: false` in function config (for admin-only functions)

### Issue: Rate limiting (429)

**Cause:** Too many requests per minute

**Solution:**
- Free tier: 15 RPM (requests per minute)
- Paid tier: 1000+ RPM
- Add delays between calls: `await new Promise(r => setTimeout(r, 100))`

### Issue: Empty content in response

**Cause:** Gemini safety filters blocking output

**Solution:** Add safety settings (if appropriate):
```typescript
safetySettings: [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]
```

## Rate Limits & Pricing

### Free Tier (as of Dec 2024)
- 15 requests per minute (RPM)
- 1 million tokens per day
- 1,500 requests per day

### Paid Tier
- 1000+ RPM
- Pay per token
- ~$0.075 per 1M input tokens
- ~$0.30 per 1M output tokens

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/enrich-startup/index.ts` | Main enrichment function |
| `supabase/functions/scrape-source/index.ts` | Scraping + enrichment |
| `supabase/functions/smart-enrich/index.ts` | Smart batch enrichment |

## Deployment

```bash
# Deploy updated function
supabase functions deploy enrich-startup --project-ref YOUR_PROJECT_REF

# Or via MCP tool (preferred)
# Use mcp_supabase_deploy_edge_function
```

## Cron Jobs

The daily enrichment runs via pg_cron:

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Manually trigger enrichment
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/enrich-startup',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
  body := '{"enrichAll": true, "batchSize": 50}'::jsonb
);
```

## Prompt Engineering Tips

**What works:**
- Simple, structured prompts with example JSON
- Lower temperature (0.3) for consistent output
- `responseMimeType: 'application/json'` forces JSON output
- Explicit field names matching database columns

**What doesn't work:**
- Very long prompts with too many instructions
- High temperature (causes inconsistent output)
- Asking for too many nested objects at once

**Working prompt structure:**
```
You are a VC analyst. Analyze this startup and return ONLY valid JSON.

STARTUP:
- Name: {name}
- Description: {description}
...

Return this exact JSON structure (all fields required):
{
  "unicorn_likelihood_score": 45,
  "hiring_velocity_score": 65,
  ...
}

Rules:
- All scores are 0-100
- Be realistic for early-stage startups
```

---

**Last Updated:** December 7, 2024
**Working Version:** enrich-startup v40

