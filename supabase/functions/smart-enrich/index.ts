/**
 * Smart Enrichment Edge Function
 * Cost-efficient: Uses Gemini's knowledge first, only scrapes with Zyte if needed
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Step 1: Ask Gemini if it knows the real data (no scraping cost)
async function askGeminiForRealData(
  startup: { name: string; website?: string; description?: string; sectors?: string[] },
  geminiApiKey: string
) {
  const prompt = `You are a startup research expert with extensive knowledge of tech companies.

**Startup:** ${startup.name}
**Website:** ${startup.website || 'Unknown'}
**Description:** ${startup.description || 'N/A'}
**Sectors:** ${startup.sectors?.join(', ') || 'N/A'}

Based on your knowledge (NOT making things up), provide REAL information about this startup.

CRITICAL RULES:
- Only include information you are CONFIDENT is accurate
- If you don't know something FOR CERTAIN, use null or empty array
- Do NOT make up founder names like "Founder 1" or "John Smith"
- Do NOT guess team sizes - only include if you know from news/reports
- Do NOT invent competitors - only list ones you know are real competitors

Return ONLY valid JSON:
{
  "confidence": "<high|medium|low|none>",
  "founders": [
    {
      "name": "<REAL founder name you know, or leave array empty>",
      "title": "<CEO/CTO/Founder>",
      "background": "<brief background if known>"
    }
  ],
  "team_size": <number if you know from news/reports, else null>,
  "team_size_confidence": "<high|medium|low|none>",
  "estimated_revenue": "<revenue if reported in news, e.g., '$10M ARR', else null>",
  "competitors": ["<REAL competitor you know>"],
  "notable_customers": ["<REAL customer you know>"],
  "founded_year": <year if known, else null>,
  "headquarters": "<city if known>",
  "key_facts": ["<verified fact about this company>"],
  "needs_scraping": <true if you have low confidence and scraping would help, false if you're confident>
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2, // Low temperature for factual responses
          maxOutputTokens: 1500,
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    if (response.status === 429) throw new Error('RATE_LIMITED')
    throw new Error(`Gemini error ${response.status}: ${errorText.substring(0, 200)}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('No response from Gemini')

  let jsonStr = text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  } else {
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) jsonStr = objectMatch[0]
  }
  
  return JSON.parse(jsonStr)
}

// Step 2: Only scrape if Gemini doesn't know (costs money)
async function scrapeWithZyte(url: string, zyteApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(zyteApiKey + ':')}`,
      },
      body: JSON.stringify({ url, browserHtml: true }),
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.browserHtml || null
  } catch {
    return null
  }
}

function extractTextFromHtml(html: string | null): string {
  if (!html) return ''
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text.substring(0, 10000)
}

async function scrapeAndExtract(
  startup: { name: string; website?: string },
  geminiApiKey: string,
  zyteApiKey: string
) {
  if (!startup.website) return null

  // Only scrape main page + about page (2 requests max)
  const baseUrl = startup.website.replace(/\/$/, '')
  
  const mainHtml = await scrapeWithZyte(baseUrl, zyteApiKey)
  const aboutHtml = await scrapeWithZyte(`${baseUrl}/about`, zyteApiKey)
  
  const content = extractTextFromHtml(mainHtml) + '\n\n' + extractTextFromHtml(aboutHtml)
  
  if (content.length < 500) return null

  // Use Gemini to extract from scraped content
  const prompt = `Extract ONLY factual information from this scraped website content for ${startup.name}:

${content.substring(0, 8000)}

Return JSON with founder names, team size, competitors found in the content. If not found, use null/empty array.
{
  "founders": [{"name": "<name from content>", "title": "<title>"}],
  "team_size": <number or null>,
  "competitors": ["<competitor mentioned>"],
  "key_facts": ["<fact from content>"]
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
      })
    }
  )

  if (!response.ok) return null
  
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null

  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch {
    return null
  }
}

interface StartupRecord {
  id: string
  name: string
  website: string | null
  description: string | null
  sectors: string[] | null
  founder_background: { founders?: Array<{ name?: string }> } | null
  team_composition: { total_employees?: number } | null
  competitive_landscape: { competitors?: string[] } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const zyteApiKey = Deno.env.get('ZYTE_API_KEY')

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 20

    // Get startups needing enrichment
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, website, description, sectors, founder_background, team_composition, competitive_landscape')
      .gte('enrichment_version', 3)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: StartupRecord[] | null; error: Error | null }

    if (fetchError) throw fetchError
    if (!startups?.length) {
      return new Response(
        JSON.stringify({ message: 'No startups to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter to those with placeholder data
    const needsEnrichment = startups.filter((s: StartupRecord) => {
      const founders = s.founder_background?.founders || []
      const hasPlaceholder = founders.some((f: { name?: string }) => 
        f.name?.includes('Founder 1') || f.name?.includes('Founder 2') || !f.name
      )
      const missingTeam = !s.team_composition?.total_employees
      const missingCompetitors = !s.competitive_landscape?.competitors?.length
      return hasPlaceholder || missingTeam || missingCompetitors
    })

    console.log(`Processing ${needsEnrichment.length} startups (Gemini-first approach)`)

    let enrichedFromGemini = 0
    let enrichedFromScrape = 0
    let skipped = 0
    let zyteRequestsUsed = 0
    const results: Array<{ name: string; source: string; data?: Record<string, unknown> }> = []

    for (const startup of needsEnrichment.slice(0, 50)) {
      try {
        console.log(`Processing: ${startup.name}`)
        
        // Step 1: Ask Gemini (FREE)
        const geminiData = await askGeminiForRealData(
          { 
            name: startup.name, 
            website: startup.website || undefined, 
            description: startup.description || undefined,
            sectors: startup.sectors || undefined
          },
          geminiApiKey
        )
        
        const hasGoodFounderData = geminiData.founders?.length > 0 && 
          geminiData.founders[0].name && 
          !geminiData.founders[0].name.includes('Founder')
        
        const hasGoodTeamData = geminiData.team_size && geminiData.team_size_confidence !== 'none'
        const hasGoodCompetitorData = geminiData.competitors?.length > 0

        let finalData = geminiData
        let source = 'gemini'

        // Step 2: Only scrape if Gemini doesn't know AND we have Zyte key
        if (geminiData.needs_scraping && zyteApiKey && (!hasGoodFounderData || !hasGoodCompetitorData)) {
          console.log(`  -> Scraping ${startup.name} (Gemini uncertain)`)
          const scrapedData = await scrapeAndExtract(
            { name: startup.name, website: startup.website || undefined },
            geminiApiKey,
            zyteApiKey
          )
          
          zyteRequestsUsed += 2 // main page + about page
          
          if (scrapedData) {
            // Merge scraped data with Gemini data
            if (scrapedData.founders?.length && scrapedData.founders[0].name) {
              finalData.founders = scrapedData.founders
            }
            if (scrapedData.team_size) {
              finalData.team_size = scrapedData.team_size
            }
            if (scrapedData.competitors?.length) {
              finalData.competitors = [...new Set([...(finalData.competitors || []), ...scrapedData.competitors])]
            }
            source = 'gemini+scrape'
            enrichedFromScrape++
          }
        } else {
          enrichedFromGemini++
        }

        // Build update
        const updateData: Record<string, unknown> = {}
        
        if (finalData.founders?.length > 0 && finalData.founders[0].name && !finalData.founders[0].name.includes('Founder')) {
          updateData.founder_background = {
            founders: finalData.founders.map((f: { name: string; background?: string }) => ({
              name: f.name,
              education: [],
              prior_startups: [],
              notable_employers: [],
              years_in_industry: null,
            })),
            advisor_network: [],
          }
        }

        if (finalData.team_size) {
          updateData.team_composition = {
            ...(startup.team_composition || {}),
            total_employees: finalData.team_size,
          }
        }

        if (finalData.competitors?.length > 0) {
          updateData.competitive_landscape = {
            competitors: finalData.competitors,
            direct_competitors: finalData.competitors.map((c: string) => ({ name: c })),
          }
        }

        if (finalData.estimated_revenue) {
          updateData.estimated_revenue = finalData.estimated_revenue
        }

        if (Object.keys(updateData).length > 0) {
          updateData.enrichment_version = 4

          await supabase
            .from('startups')
            .update(updateData)
            .eq('id', startup.id)
          
          results.push({ name: startup.name, source, data: finalData })
        } else {
          skipped++
          results.push({ name: startup.name, source: 'skipped' })
        }

      } catch (error) {
        results.push({ name: startup.name, source: `error: ${error instanceof Error ? error.message : 'Unknown'}` })
      }
    }

    const estimatedCost = zyteRequestsUsed * 0.005 // ~$0.005 per Zyte request

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_processed: needsEnrichment.length,
          enriched_from_gemini: enrichedFromGemini,
          enriched_with_scraping: enrichedFromScrape,
          skipped,
          zyte_requests: zyteRequestsUsed,
          estimated_cost: `$${estimatedCost.toFixed(3)}`,
        },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Smart enrichment error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

