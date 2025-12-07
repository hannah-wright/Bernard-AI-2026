import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Historical sources for 2023-2024 funding rounds
const HISTORICAL_SOURCES = [
  { name: 'Crunchbase Seed 2024', url: 'https://news.crunchbase.com/seed/', type: 'news', confidence: 'high' },
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/', type: 'news', confidence: 'high' },
  { name: 'VentureBeat Deals', url: 'https://venturebeat.com/category/business/deals/', type: 'news', confidence: 'high' },
  { name: 'EU Startups Funding', url: 'https://www.eu-startups.com/category/funding/', type: 'news', confidence: 'medium' },
  { name: 'Sifted News', url: 'https://sifted.eu/articles/', type: 'news', confidence: 'medium' },
  { name: 'The Information', url: 'https://www.theinformation.com/briefings', type: 'news', confidence: 'high' },
  { name: 'Forbes Startups', url: 'https://www.forbes.com/startups/', type: 'news', confidence: 'medium' },
  { name: 'Business Insider Tech', url: 'https://www.businessinsider.com/sai', type: 'news', confidence: 'medium' },
]

const HISTORICAL_CRITERIA = {
  MAX_FUNDING_AMOUNT: 10000000, // Focus on under $10M
  VALID_ROUND_TYPES: ['Pre-Seed', 'Seed', 'Series A', 'Bootstrapped'],
  EXCLUDED_COMPANIES: new Set([
    'stripe', 'airbnb', 'uber', 'lyft', 'doordash', 'instacart', 'coinbase',
    'robinhood', 'chime', 'plaid', 'discord', 'notion', 'figma', 'canva',
    'databricks', 'snowflake', 'palantir', 'slack', 'zoom', 'dropbox',
    'github', 'gitlab', 'atlassian', 'salesforce', 'oracle', 'microsoft',
    'google', 'amazon', 'meta', 'apple', 'nvidia', 'openai', 'anthropic',
    'groq', 'grok'
  ])
}

interface ZyteResponse {
  browserHtml?: string
  httpResponseBody?: string
}

interface ZyteArticle {
  headline?: string
  articleBody?: string
  url?: string
  datePublished?: string
}

interface ScrapedStartup {
  name: string
  description: string
  eli5: string
  website: string
  sectors: string[]
  city: string
  country: string
  buzz_score: number
  funding_amount: number
  round_type: string
  funding_date: string
  lead_investors: string[]
  source_name: string
  source_url: string
  confidence: string
}

async function scrapeWithZyte(url: string, zyteApiKey: string): Promise<ZyteResponse | null> {
  try {
    console.log('Scraping URL:', url)
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(zyteApiKey + ':'),
      },
      body: JSON.stringify({
        url,
        browserHtml: true,
        javascript: true,
      }),
    })

    if (!response.ok) {
      console.error('Zyte API error:', response.status, await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error scraping with Zyte:', error)
    return null
  }
}

function cleanCompanyName(name: string): string {
  return name
    .replace(/\s+(raises?|secures?|closes?|gets?|lands?|announces?|receives?)\s+.*/i, '')
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFundingFromArticle(html: string, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup | null {
  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (!titleMatch) return null
    
    const title = titleMatch[1]
    
    // Look for funding amount patterns
    const fundingPatterns = [
      /\$(\d+(?:\.\d+)?)\s*(million|m|mn)/i,
      /(\d+(?:\.\d+)?)\s*(million|m|mn)\s*(?:dollars?|\$)/i,
      /raises?\s*\$(\d+(?:\.\d+)?)\s*(million|m|mn)?/i,
      /funding\s*(?:of\s*)?\$(\d+(?:\.\d+)?)\s*(million|m|mn)?/i,
    ]
    
    let fundingAmount = 0
    for (const pattern of fundingPatterns) {
      const match = title.match(pattern) || html.match(pattern)
      if (match) {
        const num = parseFloat(match[1])
        const unit = match[2]?.toLowerCase()
        if (unit && (unit === 'million' || unit === 'm' || unit === 'mn')) {
          fundingAmount = num * 1000000
        } else if (num < 1000) {
          fundingAmount = num * 1000000 // Assume millions
        } else {
          fundingAmount = num
        }
        break
      }
    }
    
    // Skip if over $10M for historical (focus on smaller rounds)
    if (fundingAmount > HISTORICAL_CRITERIA.MAX_FUNDING_AMOUNT) {
      console.log('Skipping - funding too high:', fundingAmount)
      return null
    }
    
    // Determine round type
    let roundType = 'Seed'
    const roundPatterns = {
      'Pre-Seed': /pre[- ]?seed/i,
      'Seed': /seed\s*(round|funding)?/i,
      'Series A': /series\s*a/i,
      'Bootstrapped': /bootstrap|self[- ]?fund/i,
    }
    
    for (const [type, pattern] of Object.entries(roundPatterns)) {
      if (pattern.test(title) || pattern.test(html)) {
        roundType = type
        break
      }
    }
    
    if (!HISTORICAL_CRITERIA.VALID_ROUND_TYPES.includes(roundType)) {
      return null
    }
    
    // Extract company name from title
    let companyName = cleanCompanyName(title.split(/[,\-–—:|]/)[0])
    
    // Skip excluded companies
    if (HISTORICAL_CRITERIA.EXCLUDED_COMPANIES.has(companyName.toLowerCase())) {
      return null
    }
    
    // Skip if name is too short or generic
    if (companyName.length < 3 || /^(the|a|an|new|top|best)$/i.test(companyName)) {
      return null
    }
    
    // Extract description from meta or first paragraph
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                      html.match(/<p[^>]*>([^<]{50,300})<\/p>/i)
    const description = descMatch ? descMatch[1].trim() : `${companyName} is an emerging startup.`
    
    // Extract date
    const dateMatch = html.match(/(\d{4}[-/]\d{2}[-/]\d{2})/) ||
                      html.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i)
    
    let fundingDate = new Date().toISOString().split('T')[0]
    if (dateMatch) {
      try {
        const parsed = new Date(dateMatch[0])
        if (!isNaN(parsed.getTime())) {
          fundingDate = parsed.toISOString().split('T')[0]
        }
      } catch {}
    }
    
    // Detect sectors
    const sectorKeywords: Record<string, string[]> = {
      'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'llm', 'gpt'],
      'SaaS': ['saas', 'software as a service', 'cloud software', 'b2b software'],
      'Fintech': ['fintech', 'financial', 'banking', 'payments', 'lending', 'insurance'],
      'Healthcare': ['health', 'medical', 'biotech', 'pharma', 'clinical', 'patient'],
      'E-commerce': ['ecommerce', 'e-commerce', 'retail', 'shopping', 'marketplace'],
      'Climate': ['climate', 'sustainability', 'green', 'clean energy', 'carbon'],
      'Enterprise': ['enterprise', 'b2b', 'business'],
      'Developer Tools': ['developer', 'api', 'devops', 'infrastructure'],
    }
    
    const sectors: string[] = []
    const lowerHtml = html.toLowerCase()
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(kw => lowerHtml.includes(kw))) {
        sectors.push(sector)
        if (sectors.length >= 3) break
      }
    }
    if (sectors.length === 0) sectors.push('Enterprise')
    
    // Extract investors
    const investorPatterns = [
      /led by ([^,\.]+)/i,
      /investors? include ([^\.]+)/i,
      /backed by ([^,\.]+)/i,
    ]
    
    const leadInvestors: string[] = []
    for (const pattern of investorPatterns) {
      const match = html.match(pattern)
      if (match) {
        leadInvestors.push(match[1].trim())
        break
      }
    }
    
    return {
      name: companyName,
      description: description.slice(0, 500),
      eli5: `${companyName} is a startup in the ${sectors[0]} space.`,
      website: '',
      sectors,
      city: '',
      country: 'United States',
      buzz_score: Math.floor(Math.random() * 30) + 50,
      funding_amount: fundingAmount,
      round_type: roundType,
      funding_date: fundingDate,
      lead_investors: leadInvestors,
      source_name: sourceName,
      source_url: sourceUrl,
      confidence,
    }
  } catch (error) {
    console.error('Error parsing article:', error)
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveStartup(supabase: any, startup: ScrapedStartup): Promise<{ saved: boolean; updated: boolean; error?: string }> {
  try {
    // Check if startup already exists
    const { data: existing, error: checkError } = await supabase
      .from('startups')
      .select('id, total_raised, buzz_score')
      .eq('name', startup.name)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing startup:', checkError)
      return { saved: false, updated: false, error: checkError.message }
    }
    
    if (existing) {
      // Update existing startup if new data is better
      const shouldUpdate = startup.funding_amount > (existing.total_raised || 0) || 
                          startup.buzz_score > (existing.buzz_score || 0)
      
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('startups')
          .update({
            total_raised: Math.max(startup.funding_amount, existing.total_raised || 0),
            buzz_score: Math.max(startup.buzz_score, existing.buzz_score || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        if (updateError) {
          console.error('Error updating startup:', updateError)
          return { saved: false, updated: false, error: updateError.message }
        }
        
        console.log('Updated:', startup.name)
        return { saved: false, updated: true }
      }
      
      return { saved: false, updated: false, error: 'Already exists' }
    }
    
    // Insert new startup
    const { data: newStartup, error: insertError } = await supabase
      .from('startups')
      .insert({
        name: startup.name,
        description: startup.description,
        eli5: startup.eli5,
        website: startup.website,
        sectors: startup.sectors,
        city: startup.city,
        country: startup.country,
        buzz_score: startup.buzz_score,
        total_raised: startup.funding_amount
      })
      .select()
      .single()
    
    if (insertError) {
      if (insertError.code === '23505') {
        console.log('Duplicate detected:', startup.name)
        return { saved: false, updated: false, error: 'Duplicate' }
      }
      console.error('Error inserting startup:', insertError)
      return { saved: false, updated: false, error: insertError.message }
    }
    
    // Add funding round
    if (startup.funding_amount > 0) {
      await supabase.from('funding_rounds').insert({
        startup_id: newStartup.id,
        amount: startup.funding_amount,
        round_type: startup.round_type,
        date: startup.funding_date,
        lead_investors: startup.lead_investors
      })
    }
    
    // Add data source
    await supabase.from('data_sources').insert({
      startup_id: newStartup.id,
      name: startup.source_name,
      url: startup.source_url,
      confidence: startup.confidence
    })
    
    console.log('Saved:', startup.name)
    return { saved: true, updated: false }
  } catch (error) {
    console.error('Error saving startup:', error)
    return { saved: false, updated: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const zyteApiKey = Deno.env.get('ZYTE_API_KEY')
    if (!zyteApiKey) {
      return new Response(
        JSON.stringify({ error: 'Zyte API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body safely
    let body: { sourceIndex?: number } = {}
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      console.log('No body or invalid JSON, using defaults')
    }
    
    const sourceIndex = body.sourceIndex ?? 0
    
    if (sourceIndex >= HISTORICAL_SOURCES.length) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'All historical sources processed',
          totalSources: HISTORICAL_SOURCES.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const source = HISTORICAL_SOURCES[sourceIndex]
    console.log(`=== Scraping Historical Source ${sourceIndex + 1}/${HISTORICAL_SOURCES.length}: ${source.name} ===`)
    
    // Scrape the source
    const response = await scrapeWithZyte(source.url, zyteApiKey)
    
    if (!response || !response.browserHtml) {
      const duration = Date.now() - startTime
      return new Response(
        JSON.stringify({
          success: false,
          source: source.name,
          error: 'Failed to scrape source - no HTML returned',
          durationMs: duration,
          nextSourceIndex: sourceIndex + 1,
          hasMoreSources: sourceIndex + 1 < HISTORICAL_SOURCES.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Extract article links from the page
    const linkPattern = /<a[^>]*href="([^"]*(?:funding|raises?|seed|series|million|startup)[^"]*)"/gi
    const links: string[] = []
    let match
    while ((match = linkPattern.exec(response.browserHtml)) !== null && links.length < 20) {
      const href = match[1]
      if (href.startsWith('http') && !href.includes('twitter') && !href.includes('linkedin')) {
        links.push(href)
      }
    }
    
    console.log(`Found ${links.length} potential article links`)
    
    const startups: ScrapedStartup[] = []
    let saved = 0
    let updated = 0
    let errors = 0
    
    // Process each article (limit to 10 for efficiency)
    for (const link of links.slice(0, 10)) {
      try {
        console.log('Processing article:', link)
        const articleResponse = await scrapeWithZyte(link, zyteApiKey)
        
        if (articleResponse?.browserHtml) {
          const startup = parseFundingFromArticle(
            articleResponse.browserHtml,
            source.name,
            link,
            source.confidence
          )
          
          if (startup) {
            startups.push(startup)
            const result = await saveStartup(supabase, startup)
            if (result.saved) saved++
            if (result.updated) updated++
            if (result.error && result.error !== 'Already exists' && result.error !== 'Duplicate') {
              errors++
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (articleError) {
        console.error('Error processing article:', articleError)
        errors++
      }
    }
    
    const duration = Date.now() - startTime
    
    return new Response(
      JSON.stringify({
        success: true,
        source: source.name,
        sourceIndex,
        articlesProcessed: Math.min(links.length, 10),
        startupsFound: startups.length,
        startupsSaved: saved,
        startupsUpdated: updated,
        errors,
        durationMs: duration,
        nextSourceIndex: sourceIndex + 1,
        hasMoreSources: sourceIndex + 1 < HISTORICAL_SOURCES.length,
        savedStartups: startups.filter((_, i) => i < 5).map(s => s.name) // Show first 5 names
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

