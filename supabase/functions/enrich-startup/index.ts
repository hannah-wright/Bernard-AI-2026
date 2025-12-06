/**
 * Startup Enrichment Edge Function
 * 
 * Uses Google Gemini API for AI-powered VC intelligence enrichment.
 * Gemini offers a generous free tier: 15 RPM, 1M tokens/day for Flash model.
 * 
 * Required secret: GEMINI_API_KEY (get from https://aistudio.google.com/app/apikey)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartupData {
  id: string
  name: string
  description: string
  eli5: string
  website: string
  sectors: string[]
  city: string
  country: string
  estimated_revenue: string | null
  estimated_size: string | null
  buzz_score: number
}

interface VCIntelligence {
  founder_background: Record<string, unknown>
  team_composition: Record<string, unknown>
  team_quality_score: number
  traction_metrics: Record<string, unknown>
  unit_economics: Record<string, unknown>
  product_info: Record<string, unknown>
  defensibility_signals: Record<string, unknown>
  market_context: Record<string, unknown>
  competitive_landscape: Record<string, unknown>
  social_proof: Record<string, unknown>
  risk_flags: Record<string, unknown>
  unicorn_probability: number
  product_market_fit_score: number
  investment_readiness_score: number
  region: string
  primary_market: string
  business_model: string
  company_type: string
  target_customer: string
  founder_type: string
  is_serial_founder: boolean
  accelerator: string | null
  has_faang_alumni: boolean
  has_prior_exit: boolean
  prior_exit_count: number
  investor_quality: string
  total_raised: number
  current_round_size: number
  arr_raised_ratio: number | null
  runway_band: string
  burn_multiple_band: string
  round_status: string
  has_lead: boolean
}

const ENRICHMENT_PROMPT = `You are a VC analyst. Analyze this startup and provide structured intelligence data.

STARTUP INFO:
- Name: {name}
- Description: {description}
- ELI5: {eli5}
- Website: {website}
- Industries: {sectors}
- Location: {city}, {country}
- Est. Revenue: {estimated_revenue}
- Est. Size: {estimated_size}
- Buzz Score: {buzz_score}/100

Based on this information and your knowledge, generate realistic VC intelligence data. Make educated estimates based on the company stage, industry, and available information.

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
{
  "founder_background": {
    "founders": [{"name": "Founder Name", "years_in_industry": 8, "notable_employers": ["Company1"], "education": ["University"], "prior_startups": []}],
    "advisor_network": []
  },
  "team_composition": {
    "total_employees": 25,
    "engineering_count": 12,
    "sales_count": 5,
    "product_count": 4,
    "ops_count": 4,
    "has_cto": true,
    "has_vp_sales": false,
    "has_ciso": false
  },
  "team_quality_score": 72,
  "traction_metrics": {
    "paying_customers": 50,
    "enterprise_logos": [],
    "arr": 500000,
    "net_revenue_retention_pct": 110,
    "gross_churn_pct": 5
  },
  "unit_economics": {
    "gross_margin_pct": 75,
    "ltv_cac_ratio": 3.5,
    "payback_months": 12,
    "runway_months": 18
  },
  "product_info": {
    "stage": "GA",
    "deployment_model": "SaaS",
    "ai_native": false,
    "tech_stack": ["React", "Node.js", "AWS"]
  },
  "defensibility_signals": {
    "proprietary_data": false,
    "network_effects": false,
    "switching_cost_level": "Medium",
    "patents_filed": 0
  },
  "market_context": {
    "tam_usd": 5000000000,
    "category_position": "Fast-follower",
    "market_growth_rate_pct": 15
  },
  "competitive_landscape": {
    "direct_competitors": [{"name": "Competitor1", "stage": "Series B"}],
    "competitive_advantages": ["Feature X", "Price point"]
  },
  "social_proof": {
    "cap_table_quality": "Established fund",
    "notable_investors": [],
    "press_mentions_90d": 3,
    "press_sentiment": "Positive"
  },
  "risk_flags": {
    "key_person_dependency": false,
    "single_customer_dependency": false,
    "geographic_concentration": true
  },
  "unicorn_probability": 15,
  "product_market_fit_score": 65,
  "investment_readiness_score": 70,
  "region": "US",
  "primary_market": "US",
  "business_model": "B2B",
  "company_type": "SaaS",
  "target_customer": "SMB",
  "founder_type": "Team",
  "is_serial_founder": false,
  "accelerator": null,
  "has_faang_alumni": false,
  "has_prior_exit": false,
  "prior_exit_count": 0,
  "investor_quality": "Established fund",
  "total_raised": 5000000,
  "current_round_size": 2000000,
  "arr_raised_ratio": 0.1,
  "runway_band": "12-18 months",
  "burn_multiple_band": "1-2x",
  "round_status": "Recently Closed",
  "has_lead": true
}

FIELD CONSTRAINTS:
- region/primary_market: "US", "EU", "LATAM", "APAC", "MEA", or "Remote/Global"
- business_model: "B2B", "B2C", or "B2B2C"
- company_type: "SaaS", "Marketplace", "Fintech", "Hardware", "Services", or "Other"
- target_customer: "SMB", "Mid-market", "Enterprise", "Consumer", or "All"
- founder_type: "Solo" or "Team"
- accelerator: "YC", "Techstars", "a16z", "500 Startups", "Other Tier-1", or null
- investor_quality: "Unicorn-backers", "Multi-exit fund", "Established fund", or "Angel/Seed-focus"
- runway_band: "<6 months", "6-12 months", "12-18 months", or "18+ months"
- burn_multiple_band: "<1x", "1-2x", "2-3x", or ">3x"
- round_status: "Raising", "Recently Closed", or "Exploring"
- product_info.stage: "MVP", "Beta", "GA", or "Multi-product"

Be realistic - early-stage startups should have lower scores.`

async function enrichWithGemini(startup: StartupData, apiKey: string, retryCount = 0): Promise<VCIntelligence> {
  const prompt = ENRICHMENT_PROMPT
    .replace('{name}', startup.name)
    .replace('{description}', startup.description)
    .replace('{eli5}', startup.eli5)
    .replace('{website}', startup.website)
    .replace('{sectors}', startup.sectors.join(', '))
    .replace('{city}', startup.city)
    .replace('{country}', startup.country)
    .replace('{estimated_revenue}', startup.estimated_revenue || 'Unknown')
    .replace('{estimated_size}', startup.estimated_size || 'Unknown')
    .replace('{buzz_score}', String(startup.buzz_score))

  // Use Gemini 1.5 Flash - fastest and most cost-effective
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)

    // Retry on rate limit (429) or server error (5xx) with exponential backoff
    if ((response.status === 429 || response.status >= 500) && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
      console.log(`Rate limited/error, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return enrichWithGemini(startup, apiKey, retryCount + 1)
    }

    throw new Error(`Gemini API failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  // Extract text from Gemini response
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    console.error('No content in Gemini response:', JSON.stringify(data))
    throw new Error('No content in Gemini response')
  }

  // Parse JSON - Gemini with responseMimeType should return clean JSON
  let jsonStr = content.trim()
  
  // Handle potential markdown code blocks (fallback)
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
  jsonStr = jsonStr.trim()

  try {
    return JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', jsonStr.slice(0, 500))
    throw new Error('Invalid JSON in Gemini response')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Try Gemini first, fall back to Lovable if configured
    let apiKey = Deno.env.get('GEMINI_API_KEY')
    let useGemini = true
    
    if (!apiKey) {
      // Fallback to Lovable API if Gemini not configured
      apiKey = Deno.env.get('LOVABLE_API_KEY')
      useGemini = false
      
      if (!apiKey) {
        console.error('No AI API key configured. Set GEMINI_API_KEY (recommended) or LOVABLE_API_KEY')
        return new Response(
          JSON.stringify({ 
            error: 'AI API key not configured',
            help: 'Set GEMINI_API_KEY in Supabase secrets. Get a free key at https://aistudio.google.com/app/apikey'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { startupId, startupIds, enrichAll, forceReenrich, batchSize = 50 } = await req.json()

    let startupsToEnrich: StartupData[] = []

    if (startupIds && Array.isArray(startupIds) && startupIds.length > 0) {
      // Enrich specific startups by IDs
      const { data: startups, error } = await supabase
        .from('startups')
        .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')
        .in('id', startupIds)

      if (error) throw error
      startupsToEnrich = startups || []
    } else if (enrichAll) {
      // Enrich startups - either all or only those without data
      let query = supabase
        .from('startups')
        .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')

      if (!forceReenrich) {
        query = query.or('unicorn_probability.is.null,team_quality_score.is.null')
      }

      const { data: startups, error } = await query.limit(Math.min(batchSize, 100))
      if (error) throw error
      startupsToEnrich = startups || []
    } else if (startupId) {
      // Enrich single startup
      const { data: startup, error } = await supabase
        .from('startups')
        .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')
        .eq('id', startupId)
        .single()

      if (error) throw error
      if (startup) startupsToEnrich = [startup]
    }

    if (startupsToEnrich.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No startups to enrich', enriched: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Enriching ${startupsToEnrich.length} startups using ${useGemini ? 'Gemini' : 'Lovable'} API...`)

    let enriched = 0
    let errors = 0
    const failedStartups: string[] = []

    for (const startup of startupsToEnrich) {
      try {
        console.log(`Enriching ${startup.name}...`)
        
        const intelligence = await enrichWithGemini(startup, apiKey)

        const { error: updateError } = await supabase
          .from('startups')
          .update({
            founder_background: intelligence.founder_background,
            team_composition: intelligence.team_composition,
            team_quality_score: intelligence.team_quality_score,
            traction_metrics: intelligence.traction_metrics,
            unit_economics: intelligence.unit_economics,
            product_info: intelligence.product_info,
            defensibility_signals: intelligence.defensibility_signals,
            market_context: intelligence.market_context,
            competitive_landscape: intelligence.competitive_landscape,
            social_proof: intelligence.social_proof,
            risk_flags: intelligence.risk_flags,
            unicorn_probability: intelligence.unicorn_probability,
            product_market_fit_score: intelligence.product_market_fit_score,
            investment_readiness_score: intelligence.investment_readiness_score,
            region: intelligence.region,
            primary_market: intelligence.primary_market,
            business_model: intelligence.business_model,
            company_type: intelligence.company_type,
            target_customer: intelligence.target_customer,
            founder_type: intelligence.founder_type,
            is_serial_founder: intelligence.is_serial_founder,
            accelerator: intelligence.accelerator,
            has_faang_alumni: intelligence.has_faang_alumni,
            has_prior_exit: intelligence.has_prior_exit,
            prior_exit_count: intelligence.prior_exit_count,
            investor_quality: intelligence.investor_quality,
            total_raised: intelligence.total_raised,
            current_round_size: intelligence.current_round_size,
            arr_raised_ratio: intelligence.arr_raised_ratio,
            runway_band: intelligence.runway_band,
            burn_multiple_band: intelligence.burn_multiple_band,
            round_status: intelligence.round_status,
            has_lead: intelligence.has_lead,
            updated_at: new Date().toISOString(),
          })
          .eq('id', startup.id)

        if (updateError) {
          console.error(`Failed to update ${startup.name}:`, updateError)
          errors++
          failedStartups.push(startup.name)
        } else {
          console.log(`✓ Successfully enriched ${startup.name}`)
          enriched++
        }

        // Small delay between requests to respect rate limits
        // Gemini free tier: 15 RPM = 1 request per 4 seconds
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.error(`Error enriching ${startup.name}:`, err)
        errors++
        failedStartups.push(startup.name)
        
        // If we hit quota limits, stop processing
        if (err instanceof Error && err.message.includes('429')) {
          console.log('Rate limit hit, stopping batch...')
          break
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enrichment complete`,
        provider: useGemini ? 'Google Gemini' : 'Lovable AI',
        stats: {
          total: startupsToEnrich.length,
          enriched,
          errors,
          failedStartups: failedStartups.length > 0 ? failedStartups : undefined,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Enrichment failed:', error)
    return new Response(
      JSON.stringify({ error: 'Enrichment failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
