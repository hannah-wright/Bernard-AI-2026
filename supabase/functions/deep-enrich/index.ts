/**
 * Deep Enrichment Edge Function
 * Uses Zyte to scrape real data (founders, team size, competitors) 
 * then Gemini to structure and analyze it
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Zyte API for web scraping
async function scrapeWithZyte(url: string, zyteApiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(zyteApiKey + ':')}`,
      },
      body: JSON.stringify({
        url: url,
        browserHtml: true,
      }),
    })

    if (!response.ok) {
      console.log(`Zyte error for ${url}: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.browserHtml || null
  } catch (error) {
    console.log(`Scrape failed: ${error}`)
    return null
  }
}

// Extract text content from HTML
function extractTextFromHtml(html: string | null): string {
  if (!html) return ''
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text.substring(0, 15000)
}

// Scrape company website for team/about info
async function scrapeCompanyWebsite(website: string, zyteApiKey: string) {
  if (!website) return null
  
  const baseUrl = website.replace(/\/$/, '')
  const aboutUrls = [
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/team`,
    `${baseUrl}/company`,
  ]

  // Try the main page first
  const mainHtml = await scrapeWithZyte(baseUrl, zyteApiKey)
  const mainText = extractTextFromHtml(mainHtml)

  // Try about/team pages
  for (const url of aboutUrls) {
    const html = await scrapeWithZyte(url, zyteApiKey)
    if (html && html.length > 1000) {
      const text = extractTextFromHtml(html)
      if (text.toLowerCase().includes('founder') || 
          text.toLowerCase().includes('ceo') || 
          text.toLowerCase().includes('team')) {
        return { url, text: text.substring(0, 8000), mainText: mainText.substring(0, 5000) }
      }
    }
  }

  return { url: baseUrl, text: '', mainText: mainText.substring(0, 8000) }
}

// Scrape Crunchbase for company data
async function scrapeCrunchbase(companyName: string, zyteApiKey: string) {
  const searchName = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const crunchbaseUrl = `https://www.crunchbase.com/organization/${searchName}`
  
  const html = await scrapeWithZyte(crunchbaseUrl, zyteApiKey)
  if (!html) return null

  const text = extractTextFromHtml(html)
  
  if (text.includes('Page not found') || text.length < 500) {
    return null
  }

  return { url: crunchbaseUrl, text: text.substring(0, 10000) }
}

// Use Gemini to extract structured data
async function extractDataWithGemini(
  startup: { name: string; website?: string; description?: string },
  scrapedData: { websiteData?: { mainText?: string; text?: string }; crunchbaseData?: { text?: string } },
  geminiApiKey: string
) {
  const prompt = `You are a data extraction expert. Extract REAL, FACTUAL information from the scraped website content below.

**Startup:** ${startup.name}
**Website:** ${startup.website || 'Unknown'}
**Current Description:** ${startup.description || 'N/A'}

**SCRAPED CONTENT FROM COMPANY WEBSITE:**
${scrapedData.websiteData?.mainText || 'Not available'}

${scrapedData.websiteData?.text || ''}

**SCRAPED CONTENT FROM CRUNCHBASE:**
${scrapedData.crunchbaseData?.text || 'Not available'}

IMPORTANT: Only extract information that is EXPLICITLY stated in the scraped content above. 
- If you cannot find specific founder names, leave the array empty - do NOT make up names
- If you cannot find team size, set to null
- If you cannot find revenue, set to null
- If you cannot find competitors, leave the array empty

Return ONLY valid JSON (no markdown):
{
  "founders": [
    {
      "name": "<real name found or empty array if not found>",
      "title": "<CEO/CTO/etc if found>",
      "prior_companies": ["<company names found>"],
      "education": ["<schools found>"]
    }
  ],
  "team_size": <number if found, else null>,
  "estimated_revenue": "<revenue if found, e.g., '$5M-10M ARR', else null>",
  "competitors": ["<competitor 1>", "<competitor 2>", "<competitor 3>"],
  "headquarters": "<city, country if found>",
  "founded_year": <year if found, else null>,
  "notable_customers": ["<customer names if found>"],
  "key_facts": ["<important fact 1>", "<important fact 2>"]
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini error ${response.status}: ${errorText.substring(0, 200)}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from Gemini')
  }

  let jsonStr = text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  } else {
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      jsonStr = objectMatch[0]
    }
  }
  
  return JSON.parse(jsonStr)
}

interface StartupRecord {
  id: string
  name: string
  website: string | null
  description: string | null
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

    if (!zyteApiKey) {
      return new Response(
        JSON.stringify({ error: 'ZYTE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get request body for optional limit
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 10

    // Find startups with missing/placeholder data
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, website, description, founder_background, team_composition, competitive_landscape')
      .gte('enrichment_version', 3)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: StartupRecord[] | null; error: Error | null }

    if (fetchError) throw fetchError
    if (!startups || startups.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No startups to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter to those needing enrichment
    const startupsToEnrich = startups.filter((s: StartupRecord) => {
      const founders = s.founder_background?.founders || []
      const hasPlaceholder = founders.some((f: { name?: string }) => 
        f.name?.includes('Founder 1') || f.name?.includes('Founder 2') || !f.name
      )
      const missingTeam = !s.team_composition?.total_employees
      const missingCompetitors = !s.competitive_landscape?.competitors?.length
      return hasPlaceholder || missingTeam || missingCompetitors
    })

    console.log(`Processing ${startupsToEnrich.length} startups...`)

    let enriched = 0
    let failed = 0
    const results: Array<{ name: string; status: string; data?: Record<string, unknown> }> = []

    for (const startup of startupsToEnrich.slice(0, 5)) { // Process max 5 per request
      try {
        console.log(`Processing: ${startup.name}`)
        
        // Scrape company website
        const websiteData = startup.website ? await scrapeCompanyWebsite(startup.website, zyteApiKey) : null
        
        // Scrape Crunchbase
        const crunchbaseData = await scrapeCrunchbase(startup.name, zyteApiKey)
        
        if (!websiteData?.text && !websiteData?.mainText && !crunchbaseData?.text) {
          results.push({ name: startup.name, status: 'skipped - no data scraped' })
          continue
        }

        // Extract with Gemini
        const extractedData = await extractDataWithGemini(
          { name: startup.name, website: startup.website || undefined, description: startup.description || undefined },
          { websiteData: websiteData || undefined, crunchbaseData: crunchbaseData || undefined },
          geminiApiKey
        )
        
        // Build update
        const updateData: Record<string, unknown> = {}
        
        if (extractedData.founders?.length > 0 && extractedData.founders[0].name) {
          updateData.founder_background = {
            founders: extractedData.founders.map((f: { name: string; education?: string[]; prior_companies?: string[] }) => ({
              name: f.name,
              education: f.education || [],
              prior_startups: [],
              notable_employers: f.prior_companies || [],
              years_in_industry: null,
            })),
            advisor_network: [],
          }
        }

        if (extractedData.team_size) {
          updateData.team_composition = {
            ...(startup.team_composition || {}),
            total_employees: extractedData.team_size,
          }
        }

        if (extractedData.competitors?.length > 0) {
          updateData.competitive_landscape = {
            competitors: extractedData.competitors,
            direct_competitors: extractedData.competitors.map((c: string) => ({ name: c })),
          }
        }

        if (extractedData.estimated_revenue) {
          updateData.estimated_revenue = extractedData.estimated_revenue
        }

        if (Object.keys(updateData).length > 0) {
          updateData.enrichment_version = 4

          const { error: updateError } = await supabase
            .from('startups')
            .update(updateData)
            .eq('id', startup.id)

          if (updateError) throw updateError
          
          enriched++
          results.push({ name: startup.name, status: 'enriched', data: extractedData })
        } else {
          results.push({ name: startup.name, status: 'no new data found' })
        }

      } catch (error) {
        failed++
        results.push({ name: startup.name, status: `error: ${error instanceof Error ? error.message : 'Unknown'}` })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: startupsToEnrich.length,
        enriched,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Deep enrichment error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

