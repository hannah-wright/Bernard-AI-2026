/**
 * Bulk Enrichment Edge Function
 * 
 * Enriches multiple startups in batches with proper rate limiting.
 * Designed to be called repeatedly to process all startups over time.
 * 
 * Usage: Call with batch_size (default 10) and offset to process in chunks.
 * Gemini limits: 15 RPM for free tier, so we add delays between calls.
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

// Enrichment prompt focused on missing fields + revenue verification
const ENRICHMENT_PROMPT = `You are a VC analyst with access to founder interviews, IndieHackers, and startup news. Analyze this startup.

STARTUP INFO:
- Name: {name}
- Description: {description}
- ELI5: {eli5}
- Website: {website}
- Sectors: {sectors}
- Location: {city}, {country}
- Current Est. Revenue: {estimated_revenue}
- Current Est. Size: {estimated_size}

IMPORTANT FOR REVENUE:
1. First, search your knowledge for any publicly stated revenue/ARR for "{name}" from:
   - Founder interviews (IndieHackers, podcasts, Twitter/X posts)
   - News articles mentioning "{name} revenue" or "{name} ARR"
   - Startup profiles on IndieHackers, StarterStory, etc.
2. If you find actual stated revenue, use that and mark revenue_confidence as "verified"
3. If you can only estimate based on funding/team size, mark as "estimated"
4. Include the source if verified (e.g., "IndieHackers interview Dec 2024")

Provide a JSON response with ONLY these fields (no markdown, just raw JSON):

{
  "headcount_current": <number 1-1000, estimate based on company stage and revenue>,
  "headcount_6mo_ago": <number, slightly less than current if growing>,
  "engineering_headcount_current": <number, typically 30-50% of total for tech startups>,
  "engineering_headcount_6mo_ago": <number>,
  "hiring_velocity_score": <0-100: 80+=explosive, 60-79=strong, 40-59=moderate, 20-39=stable, <20=declining>,
  "founding_team_signal_score": <0-100 based on: prior exits +30, FAANG senior +20, network +15, worked together +15, structure +10, experience +10>,
  "team_structure_type": <one of: "solo-technical", "solo-commercial", "technical-ceo-commercial-coo", "commercial-ceo-technical-cto", "balanced-cofounders", "technical-heavy", "commercial-heavy">,
  "cofounders_worked_together_before": <boolean>,
  "unicorn_likelihood_score": <0-100: 80+=10x bet, 60-79=high, 40-59=moderate, <40=lower>,
  "is_10x_bet": <true only if unicorn_likelihood_score >= 80>,
  "backer_quality_score": <0-100: 80+=elite, 60-79=strong, 40-59=good, <40=standard>,
  "backer_hot_streak": <boolean, true if investors have 2+ recent exits>,
  "estimated_revenue": <string like "$1.2M ARR" or "$500K MRR" - update if you found better data>,
  "revenue_confidence": <"verified" if from a real source, "estimated" if predicted>,
  "revenue_source": <string describing where you found it, e.g., "IndieHackers interview" or "Estimated from Series A funding and 25 employees" - be specific>
}

Be realistic - early stage startups should have lower scores. Base estimates on typical patterns for companies at this stage.
Revenue confidence should ONLY be "verified" if you have actual knowledge of stated revenue from a real source.`

async function enrichWithGemini(startup: StartupData, apiKey: string): Promise<Record<string, unknown> | null> {
  const prompt = ENRICHMENT_PROMPT
    .replace('{name}', startup.name)
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
            temperature: 0.5,
            maxOutputTokens: 1024,
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
    const { batch_size = 10, offset = 0, dry_run = false } = await req.json().catch(() => ({}))
    
    console.log(`=== Bulk Enrichment: batch_size=${batch_size}, offset=${offset}, dry_run=${dry_run} ===`)

    // Find startups that need enrichment (missing key scores)
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, description, eli5, website, sectors, city, country, estimated_revenue, estimated_size, buzz_score')
      .or('unicorn_likelihood_score.is.null,hiring_velocity_score.is.null,founding_team_signal_score.is.null')
      .order('created_at', { ascending: false })
      .range(offset, offset + batch_size - 1)

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
      .or('unicorn_likelihood_score.is.null,hiring_velocity_score.is.null,founding_team_signal_score.is.null')

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      details: [] as { name: string; status: string; error?: string }[],
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

      // Build update object - only include revenue fields if we got better data
      const updateData: Record<string, unknown> = {
        headcount_current: enrichment.headcount_current,
        headcount_6mo_ago: enrichment.headcount_6mo_ago,
        engineering_headcount_current: enrichment.engineering_headcount_current,
        engineering_headcount_6mo_ago: enrichment.engineering_headcount_6mo_ago,
        hiring_velocity_score: enrichment.hiring_velocity_score,
        founding_team_signal_score: enrichment.founding_team_signal_score,
        team_structure_type: enrichment.team_structure_type,
        cofounders_worked_together_before: enrichment.cofounders_worked_together_before,
        unicorn_likelihood_score: enrichment.unicorn_likelihood_score,
        is_10x_bet: enrichment.is_10x_bet,
        backer_quality_score: enrichment.backer_quality_score,
        backer_hot_streak: enrichment.backer_hot_streak,
        updated_at: new Date().toISOString(),
      }

      // Update revenue data if provided
      if (enrichment.estimated_revenue) {
        updateData.estimated_revenue = enrichment.estimated_revenue
      }
      if (enrichment.revenue_confidence) {
        updateData.revenue_confidence = enrichment.revenue_confidence
      }
      if (enrichment.revenue_source) {
        updateData.revenue_source = enrichment.revenue_source
      }

      // Update the startup with enriched data
      const { error: updateError } = await supabase
        .from('startups')
        .update(updateData)
        .eq('id', startup.id)

      if (updateError) {
        results.failed++
        results.details.push({ name: startup.name, status: 'failed', error: updateError.message })
      } else {
        results.succeeded++
        results.details.push({ name: startup.name, status: 'success' })
      }
    }

    const nextOffset = offset + batch_size
    const hasMore = (totalCount || 0) > nextOffset

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} startups`,
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

