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
  // New fields
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

async function enrichWithAI(startup: StartupData, apiKey: string): Promise<VCIntelligence> {
  const prompt = `You are a VC analyst. Analyze this startup and provide structured intelligence data.

STARTUP INFO:
- Name: ${startup.name}
- Description: ${startup.description}
- ELI5: ${startup.eli5}
- Website: ${startup.website}
- Industries: ${startup.sectors.join(', ')}
- Location: ${startup.city}, ${startup.country}
- Est. Revenue: ${startup.estimated_revenue || 'Unknown'}
- Est. Size: ${startup.estimated_size || 'Unknown'}
- Buzz Score: ${startup.buzz_score}/100

Based on this information and your knowledge, generate realistic VC intelligence data. Make educated estimates based on the company stage, industry, and available information.

Return a JSON object with these exact fields:
{
  "founder_background": {
    "founders": [{"name": "Founder Name", "years_in_industry": 8, "notable_employers": ["Company1", "Company2"], "education": ["University"], "prior_startups": []}],
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
    "tech_stack": ["React", "Node.js", "AWS"],
    "certifications": []
  },
  "defensibility_signals": {
    "proprietary_data": false,
    "network_effects": false,
    "switching_cost_level": "Medium",
    "patents_filed": 0,
    "patents_granted": 0
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
    "cap_table_quality": "Tier 2",
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
  "investor_quality": "Tier 2",
  "total_raised": 5000000,
  "current_round_size": 2000000,
  "arr_raised_ratio": 0.1,
  "runway_band": "12-18 months",
  "burn_multiple_band": "1-2x",
  "round_status": "Recently Closed",
  "has_lead": true
}

IMPORTANT FIELD VALUES:
- region: One of "US", "EU", "LATAM", "APAC", "MEA", "Remote/Global"
- primary_market: One of "US", "EU", "LATAM", "APAC", "MEA", "Remote/Global"
- business_model: One of "B2B", "B2C", "B2B2C"
- company_type: One of "SaaS", "Marketplace", "Fintech", "Hardware", "Services", "Other"
- target_customer: One of "SMB", "Mid-market", "Enterprise", "Consumer", "All"
- founder_type: One of "Solo", "Team"
- accelerator: One of "YC", "Techstars", "a16z", "500 Startups", "Other Tier-1", null
- investor_quality: One of "Tier 1", "Tier 2", "Tier 3", "Angels only"
- runway_band: One of "<6 months", "6-12 months", "12-18 months", "18+ months"
- burn_multiple_band: One of "<1x", "1-2x", "2-3x", ">3x"
- round_status: One of "Raising", "Recently Closed", "Exploring"

Be realistic with scores based on the company stage. Early-stage companies should have lower scores. Consider industry benchmarks.
ONLY return valid JSON, no other text.`

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a VC analyst that provides structured startup intelligence data in JSON format only.' },
        { role: 'user', content: prompt }
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AI API error:', response.status, errorText)
    if (response.status === 429) {
      throw new Error('Rate limited - please try again later')
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted')
    }
    throw new Error(`AI enrichment failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in AI response')
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content.trim()
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }
  jsonStr = jsonStr.trim()

  try {
    return JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('Failed to parse AI response:', jsonStr)
    throw new Error('Invalid JSON in AI response')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { startupId, enrichAll, forceReenrich } = await req.json()

    let startupsToEnrich: StartupData[] = []

    if (enrichAll) {
      // Enrich startups - either all or only those without data
      let query = supabase
        .from('startups')
        .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')
      
      // If not forcing re-enrich, only get startups without region (new field)
      if (!forceReenrich) {
        query = query.is('region', null)
      }
      
      const { data: startups, error } = await query.limit(25) // Process 25 at a time for faster bulk enrichment

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

    console.log(`Enriching ${startupsToEnrich.length} startups...`)

    let enriched = 0
    let errors = 0

    for (const startup of startupsToEnrich) {
      try {
        console.log(`Enriching ${startup.name}...`)
        const intelligence = await enrichWithAI(startup, lovableApiKey)

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
            // New fields
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
          })
          .eq('id', startup.id)

        if (updateError) {
          console.error(`Failed to update ${startup.name}:`, updateError)
          errors++
        } else {
          console.log(`Successfully enriched ${startup.name}`)
          enriched++
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (err) {
        console.error(`Error enriching ${startup.name}:`, err)
        errors++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Enrichment complete`,
        stats: {
          total: startupsToEnrich.length,
          enriched,
          errors
        }
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