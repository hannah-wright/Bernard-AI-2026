/**
 * Bulk Enrichment Edge Function - V3 (Data Quality Focus)
 * 
 * CORE PRINCIPLE: Data accuracy and trust are paramount.
 * Every piece of data must be:
 * - Verifiable from real sources
 * - Cross-checked when possible
 * - Clearly marked as verified vs estimated
 * 
 * This function enriches startups with:
 * 1. REAL revenue data from news/founder statements
 * 2. ALL funding rounds (not just latest)
 * 3. Competitors based on sector
 * 4. Accurate headcount and growth
 * 5. Source attribution for every data point
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors.ts"

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

// Comprehensive enrichment prompt - focused on DATA ACCURACY
const ENRICHMENT_PROMPT = `You are a VC research analyst. Your PRIMARY job is finding ACCURATE, VERIFIABLE data.

STARTUP: {name}
Description: {description}
Sectors: {sectors}
Location: {city}, {country}
Website: {website}
Current Revenue Estimate: {estimated_revenue}

=== ⚠️ CRITICAL: DATA ACCURACY IS THE #1 PRIORITY ===

🚫 FORBIDDEN - DO NOT USE THESE PLACEHOLDER VALUES:
- "$500K ARR" - THIS IS A COMMON DEFAULT. NEVER USE IT UNLESS VERIFIED.
- "$500K" - Same problem. DO NOT USE.
- Round numbers like "$1M ARR", "$5M ARR" without a source
- Any revenue figure you cannot verify with a real source

If you don't know the revenue, set amount to null and confidence to "unknown".
Better to admit "unknown" than guess incorrectly.

1. REVENUE - Search your knowledge THOROUGHLY:
   - Search for "{name} revenue" - look for TechCrunch, Forbes, Bloomberg mentions
   - Search for "{name} ARR" - annual recurring revenue announcements
   - Search for founder interviews mentioning revenue
   - Check if company announced revenue milestones
   
   Examples of VERIFIED revenue (with real sources):
   - "Notion reached $10M ARR" (TechCrunch 2019)
   - "Linear hits $1M ARR" (founder tweet 2020)
   - "Vercel announces $100M ARR" (press release 2023)
   - "Lovable hits $200M ARR" (TechCrunch Nov 2025)
   - "Cursor reaches $100M ARR" (Bloomberg Dec 2024)
   
   RULES:
   ✅ If you find REAL revenue with a SOURCE, use it and mark "verified"
   ✅ If you can estimate based on funding/team size, mark "estimated" with methodology
   ❌ If you have NO DATA, set amount to null and confidence to "unknown"
   ❌ NEVER use $500K, $500K ARR, or similar placeholder values

2. FUNDING ROUNDS - List ALL rounds you know about:
   For {name}, search your knowledge for:
   - Seed round (amount, date, lead investor)
   - Series A (amount, date, lead investor)
   - Series B, C, D, etc.
   
   DO NOT make up funding rounds. Only include rounds you have real knowledge of.

3. COMPETITORS - Based on what {name} does ({description}):
   List 3-5 direct competitors. Think about:
   - What category is this? (e.g., CRM, DevTools, AI assistant)
   - Who else serves the same customers?
   - Include their funding stage if known
   
   Examples:
   - For Notion: Coda, Confluence, Slite, Obsidian, Roam
   - For Linear: Jira, Asana, Shortcut, Height
   - For Vercel: Netlify, Railway, Render, Fly.io
   - For Lovable: Cursor, Bolt.new, v0, Replit, Windsurf

4. HEADCOUNT - Search for employee count:
   - LinkedIn company page mentions
   - Company about pages
   - Recent news about hiring

5. UNICORN SCORE - Use this formula STRICTLY:
   - Revenue velocity (0-40): 10x growth = 40, 5x = 30, 2x = 20
   - Absolute traction (0-25): $100M+ ARR = 25, $50M = 20, $10M = 15
   - Market (0-20): Hot market = 20, growing = 10
   - Team (0-15): Prior exit = 15, strong pedigree = 10

Provide JSON response (no markdown, no code blocks, just raw JSON):

{
  "revenue": {
    "amount": "<string like '$50M ARR' OR null if unknown - NEVER USE $500K AS DEFAULT>",
    "confidence": "<'verified' if real source | 'estimated' if calculated | 'unknown' if no data>",
    "source": "<specific source like 'TechCrunch Jan 2024' OR 'Unknown - no public data found'>",
    "growth_rate": "<'10x YoY' or '2x YoY' or 'unknown'>"
  },
  "funding_rounds": [
    {
      "round_type": "<Seed|Pre-Seed|Series A|Series B|Series C|Series D+>",
      "amount": <number in USD>,
      "date": "<YYYY-MM-DD or YYYY-MM or YYYY>",
      "lead_investors": ["<investor names>"],
      "source": "<where you found this>"
    }
  ],
  "total_funding": <number in USD - sum of all rounds>,
  "competitors": [
    {
      "name": "<competitor name>",
      "stage": "<funding stage if known>",
      "funding_total": <number or null>,
      "overlap_pct": <0-100 how similar>
    }
  ],
  "headcount": {
    "current": <total employees>,
    "engineering_count": <number of engineers>,
    "sales_count": <number of sales people>,
    "marketing_count": <number of marketers>,
    "executive_hires": <executive hires in last 12 months>,
    "growth_yoy_pct": <percent growth YoY>,
    "source": "<where you found this>"
  },
  "scores": {
    "unicorn_likelihood": <0-100>,
    "is_10x_bet": <boolean>,
    "hiring_velocity": <0-100>,
    "founding_team_signal": <0-100>,
    "backer_quality": <0-100>
  },
  "team": {
    "structure_type": "<solo-technical|solo-commercial|technical-ceo-commercial-coo|balanced-cofounders|technical-heavy|commercial-heavy>",
    "cofounders_worked_together": <boolean or null>,
    "has_prior_exit": <boolean>,
    "has_cto": <boolean>,
    "has_vp_sales": <boolean>,
    "has_ciso": <boolean>,
    "technical_cofounder": <boolean>,
    "avg_years_experience": <average years of founder experience>,
    "founders": [
      {
        "name": "<founder name>",
        "role": "<CEO|CTO|COO|etc>",
        "education": ["<school name>"],
        "notable_employers": ["<previous company names - FAANG, unicorns, etc>"],
        "years_in_industry": <number>
      }
    ],
    "prior_exits": [
      {
        "company_name": "<name>",
        "exit_year": <year>,
        "exit_type": "<acquisition|ipo>",
        "acquirer": "<acquirer name if acquisition>",
        "amount": <number or null>
      }
    ]
  },
  "incumbent_threats": ["<large companies that could compete>"],
  "competitive_advantages": ["<moats and advantages>"],
  "data_sources_used": ["<list of sources you used to gather this data>"]
}

IMPORTANT: Be CONSERVATIVE. If you don't have real data, say so. Don't make up numbers.
Mark revenue as "estimated" unless you have a real source.
Only include funding rounds you actually know about.`

async function enrichWithGemini(startup: StartupData, apiKey: string): Promise<Record<string, unknown> | null> {
  const prompt = ENRICHMENT_PROMPT
    .replace(/{name}/g, startup.name)
    .replace('{description}', startup.description || '')
    .replace('{eli5}', startup.eli5 || '')
    .replace('{website}', startup.website || '')
    .replace('{sectors}', startup.sectors?.join(', ') || 'Unknown')
    .replace('{city}', startup.city || 'Unknown')
    .replace('{country}', startup.country || 'Unknown')
    .replace('{estimated_revenue}', startup.estimated_revenue || 'Unknown')
    .replace('{estimated_size}', startup.estimated_size || 'Unknown')

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more factual responses
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      console.error(`Gemini error for ${startup.name}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!content) {
      console.error(`No content for ${startup.name}`)
      return null
    }

    // Parse the JSON response
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error(`Error enriching ${startup.name}:`, error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Get parameters
    const { 
      batch_size = 10, 
      offset = 0, 
      dry_run = false,
      force_reenrich = false,  // Re-enrich even if already has data
      fix_bad_revenue = false, // Target startups with placeholder $500K revenue
      startup_id = null  // Enrich specific startup
    } = await req.json().catch(() => ({}))
    
    console.log(`=== Bulk Enrichment V3: batch_size=${batch_size}, offset=${offset}, force=${force_reenrich} ===`)

    // Build query
    let query = supabase
      .from('startups')
      .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')
      .order('created_at', { ascending: false })
    
    if (startup_id) {
      // Enrich specific startup
      query = query.eq('id', startup_id)
    } else if (fix_bad_revenue) {
      // PRIORITY MODE: Fix startups with placeholder $500K revenue
      console.log('🔧 Fix Bad Revenue mode: targeting startups with $500K placeholder')
      query = query.ilike('estimated_revenue', '%500K%')
    } else if (force_reenrich) {
      // Target ALL startups, prioritizing those with bad data
      // This will re-enrich everything with improved accuracy
      console.log('Force re-enrich mode: targeting all startups')
    } else {
      // Find startups needing enrichment:
      // - Missing competitors
      // - Missing or "estimated" revenue confidence
      // - Has placeholder $500K revenue
      query = query.or('direct_competitors.is.null,revenue_confidence.is.null,revenue_confidence.eq.estimated,estimated_revenue.ilike.%500K%')
    }
    
    query = query.range(offset, offset + batch_size - 1)

    const { data: startups, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch startups: ${fetchError.message}`)
    }

    if (!startups || startups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No more startups to enrich',
          processed: 0,
          offset,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${startups.length} startups to enrich`)

    // Get total count for progress tracking
    const { count: totalCount } = await supabase
      .from('startups')
      .select('*', { count: 'exact', head: true })
      .or('direct_competitors.is.null,revenue_confidence.is.null,revenue_confidence.eq.estimated')

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      details: [] as { name: string; status: string; error?: string; sources?: number }[],
    }

    // Process each startup with delay to respect rate limits
    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i] as StartupData

      // Add delay between API calls (4 seconds = 15 RPM safe)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 4000))
      }

      console.log(`Processing ${i + 1}/${startups.length}: ${startup.name}`)

      if (dry_run) {
        results.skipped++
        results.details.push({ name: startup.name, status: 'skipped (dry run)' })
        continue
      }

      const enrichment = await enrichWithGemini(startup, geminiApiKey)
      results.processed++

      if (!enrichment) {
        results.failed++
        results.details.push({ name: startup.name, status: 'failed', error: 'No enrichment data' })
        continue
      }

      console.log(`  Enrichment received for ${startup.name}:`, JSON.stringify(enrichment).slice(0, 200))

      // Build update object from structured response
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      // Revenue data - WITH VALIDATION to reject placeholder values
      const revenue = enrichment.revenue as Record<string, unknown> | undefined
      if (revenue) {
        const revenueAmount = revenue.amount as string | null
        
        // VALIDATION: Reject common placeholder values
        const FORBIDDEN_PLACEHOLDERS = ['$500K', '$500k', '$500K ARR', '$500k ARR', '500K', '500k']
        const isPlaceholder = revenueAmount && FORBIDDEN_PLACEHOLDERS.some(p => 
          revenueAmount.toLowerCase().includes(p.toLowerCase())
        )
        
        if (isPlaceholder) {
          console.log(`  ⚠️ Rejected placeholder revenue "${revenueAmount}" for ${startup.name}`)
          // Set as unknown instead of using placeholder
          updateData.estimated_revenue = null
          updateData.revenue_confidence = 'unknown'
          updateData.revenue_source = 'No verified data found'
        } else if (revenueAmount && revenueAmount !== 'null') {
          updateData.estimated_revenue = revenueAmount
          updateData.revenue_confidence = revenue.confidence || 'estimated'
          if (revenue.source) updateData.revenue_source = revenue.source
        } else {
          // Revenue is null/unknown
          updateData.revenue_confidence = 'unknown'
          updateData.revenue_source = 'No public revenue data found'
        }
      }

      // Scores
      const scores = enrichment.scores as Record<string, unknown> | undefined
      if (scores) {
        if (scores.unicorn_likelihood !== undefined) updateData.unicorn_likelihood_score = scores.unicorn_likelihood
        if (scores.is_10x_bet !== undefined) updateData.is_10x_bet = scores.is_10x_bet
        if (scores.hiring_velocity !== undefined) updateData.hiring_velocity_score = scores.hiring_velocity
        if (scores.founding_team_signal !== undefined) updateData.founding_team_signal_score = scores.founding_team_signal
        if (scores.backer_quality !== undefined) updateData.backer_quality_score = scores.backer_quality
      }

      // Headcount
      const headcount = enrichment.headcount as Record<string, unknown> | undefined
      if (headcount) {
        if (headcount.current) updateData.headcount_current = headcount.current
        if (headcount.growth_yoy_pct) updateData.employee_growth_yoy_percent = headcount.growth_yoy_pct
      }

      // Total funding
      if (enrichment.total_funding) {
        updateData.total_raised = enrichment.total_funding
      }

      // Competitors
      if (enrichment.competitors && Array.isArray(enrichment.competitors) && enrichment.competitors.length > 0) {
        updateData.direct_competitors = enrichment.competitors
      }

      // Team data
      const team = enrichment.team as Record<string, unknown> | undefined
      if (team) {
        if (team.structure_type) updateData.team_structure_type = team.structure_type
        if (team.cofounders_worked_together !== undefined) updateData.cofounders_worked_together_before = team.cofounders_worked_together
        if (team.has_prior_exit !== undefined) updateData.has_prior_exit = team.has_prior_exit
        if (team.prior_exits && Array.isArray(team.prior_exits) && team.prior_exits.length > 0) {
          updateData.prior_exits = team.prior_exits
        }
        
        // Save full founder_background JSONB
        if (team.founders || team.technical_cofounder !== undefined) {
          updateData.founder_background = {
            founders: team.founders || [],
            technical_cofounder: team.technical_cofounder || false,
            avg_years_experience: team.avg_years_experience || null,
          }
        }
      }
      
      // Team composition data (from headcount section)
      if (headcount) {
        updateData.team_composition = {
          total_employees: headcount.current || null,
          engineering_count: headcount.engineering_count || null,
          sales_count: headcount.sales_count || null,
          marketing_count: headcount.marketing_count || null,
          has_cto: team?.has_cto || null,
          has_vp_sales: team?.has_vp_sales || null,
          has_ciso: team?.has_ciso || null,
          executive_hires_last_12_mo: headcount.executive_hires || null,
        }
      }
      
      // Competitive landscape
      if (enrichment.competitors && Array.isArray(enrichment.competitors) && enrichment.competitors.length > 0) {
        updateData.competitive_landscape = {
          direct_competitors: enrichment.competitors,
          incumbent_threats: enrichment.incumbent_threats || [],
          competitive_advantages: enrichment.competitive_advantages || [],
        }
      }

      // Update startup
      const { error: updateError } = await supabase
        .from('startups')
        .update(updateData)
        .eq('id', startup.id)

      if (updateError) {
        console.error(`  Update error for ${startup.name}:`, updateError)
        results.failed++
        results.details.push({ name: startup.name, status: 'failed', error: updateError.message })
        continue
      }

      // Insert funding rounds (if any new ones)
      const fundingRounds = enrichment.funding_rounds as Array<Record<string, unknown>> | undefined
      if (fundingRounds && fundingRounds.length > 0) {
        for (const round of fundingRounds) {
          if (round.round_type && round.amount) {
            // Check if this round already exists
            const { data: existingRound } = await supabase
              .from('funding_rounds')
              .select('id')
              .eq('startup_id', startup.id)
              .eq('round_type', round.round_type)
              .maybeSingle()
            
            if (!existingRound) {
              const roundDate = round.date ? String(round.date) : new Date().toISOString().split('T')[0]
              await supabase.from('funding_rounds').insert({
                startup_id: startup.id,
                round_type: round.round_type,
                amount: round.amount,
                date: roundDate.length === 4 ? `${roundDate}-01-01` : roundDate.length === 7 ? `${roundDate}-01` : roundDate,
                lead_investors: round.lead_investors || [],
              })
              console.log(`  Added funding round: ${round.round_type} - $${round.amount}`)
            }
          }
        }
      }

      // Update data sources based on what sources Gemini used
      const dataSources = enrichment.data_sources_used as string[] | undefined
      if (dataSources && dataSources.length > 0) {
        // Clear old generic sources
        await supabase
          .from('data_sources')
          .delete()
          .eq('startup_id', startup.id)
          .eq('name', 'BernardAI Discovery')

        // Add actual sources
        for (const source of dataSources) {
          const sourceExists = await supabase
            .from('data_sources')
            .select('id')
            .eq('startup_id', startup.id)
            .eq('name', source)
            .maybeSingle()
          
          if (!sourceExists.data) {
            let confidence: string = 'medium'
            let url: string | null = null
            
            if (source.toLowerCase().includes('crunchbase')) {
              confidence = 'high'
              url = `https://crunchbase.com/organization/${startup.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
            } else if (source.toLowerCase().includes('techcrunch') || source.toLowerCase().includes('news')) {
              confidence = 'high'
              url = `https://techcrunch.com/?s=${encodeURIComponent(startup.name)}`
            } else if (source.toLowerCase().includes('linkedin')) {
              confidence = 'high'
              url = `https://linkedin.com/company/${startup.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
            } else if (source.toLowerCase().includes('website') || source.toLowerCase().includes('company')) {
              confidence = 'verified'
              url = startup.website
            }
            
            await supabase.from('data_sources').insert({
              startup_id: startup.id,
              name: source,
              confidence,
              url,
            })
          }
        }
        
        // Always add BernardAI Analysis as a source (we did AI enrichment)
        await supabase.from('data_sources').upsert({
          startup_id: startup.id,
          name: 'BernardAI Analysis',
          confidence: 'medium',
          url: null,
        }, { onConflict: 'startup_id,name' }).select()
      }

      results.succeeded++
      results.details.push({ 
        name: startup.name, 
        status: 'success',
        sources: dataSources?.length || 1
      })
    }

    const nextOffset = offset + batch_size
    const hasMore = (totalCount || 0) > nextOffset

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enriched ${results.succeeded}/${results.processed} startups`,
        ...results,
        progress: {
          offset,
          nextOffset: hasMore ? nextOffset : null,
          totalRemaining: totalCount,
          hasMore,
        },
        nextCall: hasMore 
          ? `Call again with offset=${nextOffset} to continue` 
          : 'All startups enriched!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bulk enrichment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
