/**
 * Refresh Dynamic Data Edge Function
 * 
 * Updates only dynamic/time-sensitive data for existing startups:
 * - Hiring velocity and headcount changes
 * - Recent funding rounds
 * - Buzz score updates
 * - Backer hot streak updates
 * 
 * This is more efficient than full re-enrichment since it only updates
 * fields that change frequently.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors.ts"

interface StartupForRefresh {
  id: string
  name: string
  description: string
  website: string
  sectors: string[]
  headcount_current: number | null
  engineering_headcount_current: number | null
  hiring_velocity_score: number | null
  buzz_score: number
  updated_at: string
}

interface DynamicDataUpdate {
  headcount_current: number
  headcount_6mo_ago: number
  engineering_headcount_current: number
  engineering_headcount_6mo_ago: number
  hiring_velocity_score: number
  hiring_streak_weeks: number
  buzz_score: number
  backer_hot_streak: boolean
  recent_patent_filings: number
}

const DYNAMIC_REFRESH_PROMPT = `You are a VC analyst tracking startup growth signals. Given the startup info, provide ONLY dynamic/time-sensitive metrics.

STARTUP:
- Name: {name}
- Description: {description}
- Website: {website}
- Sectors: {sectors}
- Current headcount: {headcount_current}
- Current engineering headcount: {engineering_headcount_current}
- Current hiring velocity score: {hiring_velocity_score}
- Current buzz score: {buzz_score}

Based on your knowledge of this company's recent activity (last 6 months), estimate these DYNAMIC metrics:

Return ONLY a valid JSON object with these exact fields:
{
  "headcount_current": <number, current total employees>,
  "headcount_6mo_ago": <number, employees 6 months ago>,
  "engineering_headcount_current": <number, current engineering team size>,
  "engineering_headcount_6mo_ago": <number, engineering team 6 months ago>,
  "hiring_velocity_score": <0-100: 80+=explosive, 60-79=strong, 40-59=moderate, 20-39=stable, <20=declining>,
  "hiring_streak_weeks": <number of consecutive weeks with new hires, 0 if not hiring>,
  "buzz_score": <0-100 based on recent press, social mentions, product launches>,
  "backer_hot_streak": <boolean, true if investors had 2+ exits recently>,
  "recent_patent_filings": <number of patent filings in last 12 months>
}

Focus on CHANGES and GROWTH signals. If the company is growing aggressively, reflect that in higher scores.
If no recent news, use reasonable estimates based on company stage.`

async function refreshWithGemini(startup: StartupForRefresh, apiKey: string): Promise<DynamicDataUpdate | null> {
  const prompt = DYNAMIC_REFRESH_PROMPT
    .replace('{name}', startup.name)
    .replace('{description}', startup.description || '')
    .replace('{website}', startup.website || '')
    .replace('{sectors}', startup.sectors?.join(', ') || 'Unknown')
    .replace('{headcount_current}', String(startup.headcount_current || 'Unknown'))
    .replace('{engineering_headcount_current}', String(startup.engineering_headcount_current || 'Unknown'))
    .replace('{hiring_velocity_score}', String(startup.hiring_velocity_score || 'Unknown'))
    .replace('{buzz_score}', String(startup.buzz_score || 0))

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temp for more consistent updates
            maxOutputTokens: 512,
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

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error(`Error refreshing ${startup.name}:`, error)
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

    const body = await req.json().catch(() => ({}))
    const { 
      batch_size = 20, 
      stale_days = 7,  // Refresh data older than 7 days
      min_buzz_score = 0  // Optionally prioritize high-buzz startups
    } = body

    console.log(`=== Dynamic Data Refresh: batch=${batch_size}, stale=${stale_days}d ===`)

    // Find startups that need dynamic refresh
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - stale_days)

    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, description, website, sectors, headcount_current, engineering_headcount_current, hiring_velocity_score, buzz_score, updated_at')
      .lt('updated_at', staleDate.toISOString())
      .gte('buzz_score', min_buzz_score)
      .order('buzz_score', { ascending: false }) // Prioritize high-buzz startups
      .limit(batch_size)

    if (fetchError) {
      throw new Error(`Failed to fetch startups: ${fetchError.message}`)
    }

    if (!startups || startups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No startups need dynamic refresh',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${startups.length} startups to refresh`)

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      details: [] as { name: string; status: string }[],
    }

    for (const startup of startups as StartupForRefresh[]) {
      console.log(`Refreshing dynamic data for ${startup.name}...`)
      
      const dynamicData = await refreshWithGemini(startup, geminiApiKey)
      results.processed++

      if (!dynamicData) {
        results.failed++
        results.details.push({ name: startup.name, status: 'failed' })
        continue
      }

      // Store previous values for history tracking
      const previousHeadcount = startup.headcount_current
      const previousEngHeadcount = startup.engineering_headcount_current

      // Calculate growth percentages
      const headcountGrowth = dynamicData.headcount_6mo_ago > 0 
        ? ((dynamicData.headcount_current - dynamicData.headcount_6mo_ago) / dynamicData.headcount_6mo_ago) * 100 
        : 0
      const engGrowth = dynamicData.engineering_headcount_6mo_ago > 0
        ? ((dynamicData.engineering_headcount_current - dynamicData.engineering_headcount_6mo_ago) / dynamicData.engineering_headcount_6mo_ago) * 100
        : 0

      const { error: updateError } = await supabase
        .from('startups')
        .update({
          headcount_current: dynamicData.headcount_current,
          headcount_6mo_ago: dynamicData.headcount_6mo_ago,
          engineering_headcount_current: dynamicData.engineering_headcount_current,
          engineering_headcount_6mo_ago: dynamicData.engineering_headcount_6mo_ago,
          hiring_velocity_score: dynamicData.hiring_velocity_score,
          hiring_streak_weeks: dynamicData.hiring_streak_weeks,
          buzz_score: dynamicData.buzz_score,
          backer_hot_streak: dynamicData.backer_hot_streak,
          recent_patent_filings: dynamicData.recent_patent_filings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', startup.id)

      if (updateError) {
        results.failed++
        results.details.push({ name: startup.name, status: `failed: ${updateError.message}` })
      } else {
        results.succeeded++
        results.details.push({ 
          name: startup.name, 
          status: `success (headcount: ${previousHeadcount || '?'}→${dynamicData.headcount_current}, growth: ${headcountGrowth.toFixed(0)}%)` 
        })
      }

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Dynamic refresh complete`,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dynamic refresh error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

