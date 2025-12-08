/**
 * VC Deals Enrichment Edge Function
 * 
 * Fetches and enriches VC deal intelligence:
 * 1. Recent deals by top-tier VCs (Sequoia, a16z, etc.)
 * 2. Angel investments by prominent investors
 * 3. Sector and geographic trends
 * 
 * Uses Gemini to research recent VC activity based on public data.
 * Adds new startups to database if they don't exist.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors.ts"

interface VCDeal {
  vc_firm: string
  vc_tier: 'tier1' | 'tier2' | 'tier3'
  startup_name: string
  startup_description: string
  deal_type: 'lead' | 'follow-on' | 'co-investor'
  round_type: string
  amount: number
  deal_date: string
  sector: string[]
  geography: string
  source_url?: string
  source_name?: string
}

interface AngelDeal {
  angel_name: string
  is_prominent: boolean
  startup_name: string
  startup_description: string
  amount?: number
  deal_date: string
  sector: string[]
  twitter_handle?: string
  linkedin_url?: string
}

interface DealIntelligence {
  vc_deals: VCDeal[]
  angel_deals: AngelDeal[]
  sector_trends: { sector: string; deal_count: number; total_amount: number }[]
  geographic_trends: { geography: string; deal_count: number }[]
}

// Top VCs to track
const TOP_VCS = [
  { name: 'Sequoia Capital', tier: 'tier1' },
  { name: 'Andreessen Horowitz', tier: 'tier1' },
  { name: 'Accel', tier: 'tier1' },
  { name: 'Benchmark', tier: 'tier1' },
  { name: 'Founders Fund', tier: 'tier1' },
  { name: 'Lightspeed Venture Partners', tier: 'tier1' },
  { name: 'Index Ventures', tier: 'tier1' },
  { name: 'Greylock Partners', tier: 'tier1' },
  { name: 'General Catalyst', tier: 'tier1' },
  { name: 'Kleiner Perkins', tier: 'tier1' },
  { name: 'Tiger Global', tier: 'tier1' },
  { name: 'Insight Partners', tier: 'tier1' },
  { name: 'GGV Capital', tier: 'tier1' },
  { name: 'NEA', tier: 'tier1' },
  { name: 'Bessemer Venture Partners', tier: 'tier1' },
  { name: 'Battery Ventures', tier: 'tier2' },
  { name: 'Ribbit Capital', tier: 'tier2' },
  { name: 'Coatue', tier: 'tier2' },
  { name: 'Thrive Capital', tier: 'tier2' },
  { name: 'First Round Capital', tier: 'tier2' },
]

// Prominent angels to track
const PROMINENT_ANGELS = [
  { name: 'Naval Ravikant', twitter: 'naval' },
  { name: 'Marc Andreessen', twitter: 'pmarca' },
  { name: 'Elad Gil', twitter: 'eloadeladgil' },
  { name: 'Jason Calacanis', twitter: 'jason' },
  { name: 'Sahil Bloom', twitter: 'sahilbloom' },
  { name: 'Balaji Srinivasan', twitter: 'balajis' },
  { name: 'Ryan Hoover', twitter: 'rrhoover' },
  { name: 'Garry Tan', twitter: 'garrytan' },
  { name: 'David Sacks', twitter: 'davidsacks' },
  { name: 'Keith Rabois', twitter: 'rabois' },
  { name: 'Ron Conway', twitter: null },
  { name: 'Chris Sacca', twitter: 'sacca' },
  { name: 'Ashton Kutcher', twitter: 'aplusk' },
  { name: 'Alexis Ohanian', twitter: 'alexisohanian' },
  { name: 'Cyan Banister', twitter: 'cyantist' },
]

const DEAL_RESEARCH_PROMPT = `You are a VC intelligence analyst. Research REAL, VERIFIED recent investment activity.

IMPORTANT: Only include deals that are PUBLICLY REPORTED and VERIFIED. Include source URLs where possible.

Focus on the last 3 months of deal activity.

VCs TO TRACK: {vc_list}
PROMINENT ANGELS TO TRACK: {angel_list}

Return a JSON object with this exact structure:
{
  "vc_deals": [
    {
      "vc_firm": "Sequoia Capital",
      "vc_tier": "tier1",
      "startup_name": "Startup Name",
      "startup_description": "One sentence description of what they do",
      "deal_type": "lead",
      "round_type": "Series A",
      "amount": 15000000,
      "deal_date": "2024-11-15",
      "sector": ["AI/ML", "Enterprise"],
      "geography": "US",
      "source_url": "https://techcrunch.com/...",
      "source_name": "TechCrunch"
    }
  ],
  "angel_deals": [
    {
      "angel_name": "Naval Ravikant",
      "is_prominent": true,
      "startup_name": "Startup Name",
      "startup_description": "One sentence description",
      "amount": 500000,
      "deal_date": "2024-11-10",
      "sector": ["Consumer", "AI/ML"],
      "twitter_handle": "naval",
      "linkedin_url": null
    }
  ],
  "sector_trends": [
    { "sector": "AI/ML", "deal_count": 45, "total_amount": 2500000000 },
    { "sector": "Fintech", "deal_count": 30, "total_amount": 1200000000 }
  ],
  "geographic_trends": [
    { "geography": "US", "deal_count": 120 },
    { "geography": "EU", "deal_count": 40 }
  ]
}

DEAL_TYPE options: "lead" (led the round), "follow-on" (participated), "co-investor"
ROUND_TYPE options: "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth"
GEOGRAPHY options: "US", "EU", "UK", "LATAM", "APAC", "MEA", "India", "Israel"
SECTOR options: "AI/ML", "Fintech", "Enterprise", "SaaS", "Consumer", "Healthcare", "Climate Tech", "Crypto", "Deep Tech", "Marketplace", "DevTools", "Cybersecurity"

Include at least 15-20 VC deals and 10-15 angel deals if available.
Prioritize RECENT deals (last 30 days) and LARGER amounts.
Only include deals you are confident about - do NOT fabricate data.`

async function fetchDealIntelligence(apiKey: string): Promise<DealIntelligence | null> {
  const vcList = TOP_VCS.map(v => v.name).join(', ')
  const angelList = PROMINENT_ANGELS.map(a => a.name).join(', ')
  
  const prompt = DEAL_RESEARCH_PROMPT
    .replace('{vc_list}', vcList)
    .replace('{angel_list}', angelList)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temp for factual accuracy
            maxOutputTokens: 8192, // Larger response for many deals
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      console.error(`Gemini error: ${response.status}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return null
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!content) {
      console.error('No content in Gemini response')
      return null
    }

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Error fetching deal intelligence:', error)
    return null
  }
}

Deno.serve(async (req) => {
  const preflightResponse = handleCorsPrelight(req)
  if (preflightResponse) return preflightResponse
  
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"))

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    console.log('=== Fetching VC Deal Intelligence ===')

    const intelligence = await fetchDealIntelligence(geminiApiKey)
    
    if (!intelligence) {
      throw new Error('Failed to fetch deal intelligence from Gemini')
    }

    console.log(`Got ${intelligence.vc_deals?.length || 0} VC deals, ${intelligence.angel_deals?.length || 0} angel deals`)

    const results = {
      vc_deals_added: 0,
      vc_deals_skipped: 0,
      angel_deals_added: 0,
      angel_investors_added: 0,
      startups_added: 0,
      errors: [] as string[],
    }

    // Process VC deals
    for (const deal of intelligence.vc_deals || []) {
      try {
        // Check if startup exists, create if not
        let startupId: string | null = null
        
        const { data: existingStartup } = await supabase
          .from('startups')
          .select('id')
          .ilike('name', deal.startup_name)
          .maybeSingle()

        if (existingStartup) {
          startupId = existingStartup.id
        } else {
          // Create new startup
          const { data: newStartup, error: createError } = await supabase
            .from('startups')
            .insert({
              name: deal.startup_name,
              description: deal.startup_description,
              eli5: deal.startup_description,
              sectors: deal.sector,
              city: deal.geography === 'US' ? 'San Francisco' : deal.geography,
              country: deal.geography === 'US' ? 'United States' : deal.geography,
              buzz_score: 60, // Default buzz for funded startup
              confidence_level: 'medium',
            })
            .select('id')
            .single()

          if (createError) {
            console.error(`Failed to create startup ${deal.startup_name}:`, createError)
            results.errors.push(`Failed to create startup: ${deal.startup_name}`)
            continue
          }
          
          startupId = newStartup.id
          results.startups_added++
          console.log(`✓ Created new startup: ${deal.startup_name}`)
        }

        // Check for duplicate deal
        const { data: existingDeal } = await supabase
          .from('vc_deals')
          .select('id')
          .eq('vc_firm', deal.vc_firm)
          .eq('startup_name', deal.startup_name)
          .eq('round_type', deal.round_type)
          .maybeSingle()

        if (existingDeal) {
          results.vc_deals_skipped++
          continue
        }

        // Insert VC deal
        const { error: dealError } = await supabase
          .from('vc_deals')
          .insert({
            vc_firm: deal.vc_firm,
            vc_tier: deal.vc_tier,
            startup_name: deal.startup_name,
            startup_id: startupId,
            deal_type: deal.deal_type,
            round_type: deal.round_type,
            amount: deal.amount,
            deal_date: deal.deal_date,
            sector: deal.sector,
            geography: deal.geography,
            source_url: deal.source_url,
            source_name: deal.source_name,
          })

        if (dealError) {
          console.error(`Failed to insert deal for ${deal.startup_name}:`, dealError)
          results.errors.push(`Failed to insert deal: ${deal.startup_name}`)
        } else {
          results.vc_deals_added++
          console.log(`✓ Added VC deal: ${deal.vc_firm} → ${deal.startup_name} (${deal.round_type})`)
        }
      } catch (err) {
        console.error(`Error processing VC deal:`, err)
        results.errors.push(`Error processing deal: ${deal.startup_name}`)
      }
    }

    // Process angel investors and their deals
    for (const deal of intelligence.angel_deals || []) {
      try {
        // Ensure angel investor exists
        const { data: existingAngel } = await supabase
          .from('angel_investors')
          .select('id')
          .ilike('name', deal.angel_name)
          .maybeSingle()

        let angelId: string

        if (!existingAngel) {
          const { data: newAngel, error: angelError } = await supabase
            .from('angel_investors')
            .insert({
              name: deal.angel_name,
              is_prominent: deal.is_prominent,
              sectors: deal.sector,
              twitter_handle: deal.twitter_handle,
              linkedin_url: deal.linkedin_url,
            })
            .select('id')
            .single()

          if (angelError) {
            console.error(`Failed to create angel ${deal.angel_name}:`, angelError)
            continue
          }
          
          angelId = newAngel.id
          results.angel_investors_added++
          console.log(`✓ Created angel investor: ${deal.angel_name}`)
        } else {
          angelId = existingAngel.id
        }

        // Check if startup exists for the angel deal
        let startupId: string | null = null
        
        const { data: existingStartup } = await supabase
          .from('startups')
          .select('id')
          .ilike('name', deal.startup_name)
          .maybeSingle()

        if (existingStartup) {
          startupId = existingStartup.id
        } else {
          // Create new startup
          const { data: newStartup, error: createError } = await supabase
            .from('startups')
            .insert({
              name: deal.startup_name,
              description: deal.startup_description,
              eli5: deal.startup_description,
              sectors: deal.sector,
              buzz_score: 50, // Slightly lower buzz for angel-backed
              confidence_level: 'medium',
            })
            .select('id')
            .single()

          if (createError) {
            console.error(`Failed to create startup ${deal.startup_name}:`, createError)
            continue
          }
          
          startupId = newStartup.id
          results.startups_added++
        }

        // Check for duplicate angel deal (using startup_angel_investments if it exists)
        const { data: existingInvestment } = await supabase
          .from('startup_angel_investments')
          .select('id')
          .eq('angel_investor_id', angelId)
          .eq('startup_id', startupId)
          .maybeSingle()

        if (!existingInvestment && startupId) {
          const { error: investError } = await supabase
            .from('startup_angel_investments')
            .insert({
              angel_investor_id: angelId,
              startup_id: startupId,
              amount: deal.amount,
              investment_date: deal.deal_date,
            })

          if (!investError) {
            results.angel_deals_added++
            console.log(`✓ Added angel deal: ${deal.angel_name} → ${deal.startup_name}`)
          }
        }
      } catch (err) {
        console.error(`Error processing angel deal:`, err)
        results.errors.push(`Error processing angel deal: ${deal.startup_name}`)
      }
    }

    // Get summary stats
    const { count: totalVCDeals } = await supabase
      .from('vc_deals')
      .select('*', { count: 'exact', head: true })

    const { count: totalAngels } = await supabase
      .from('angel_investors')
      .select('*', { count: 'exact', head: true })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VC Deal Intelligence enrichment complete',
        results,
        totals: {
          vc_deals: totalVCDeals,
          angel_investors: totalAngels,
        },
        trends: {
          sectors: intelligence.sector_trends,
          geography: intelligence.geographic_trends,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('VC Deals enrichment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

