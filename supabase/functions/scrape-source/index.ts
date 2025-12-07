import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZyteArticle {
  headline?: string
  articleBody?: string
  description?: string
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
  funding_amount: number
  round_type: string
  funding_date: string
  lead_investors: string[]
  buzz_score: number
  source_name: string
  source_url: string
  confidence: string
}

// All available sources
const ALL_SOURCES = [
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/', type: 'news', confidence: 'high' },
  { name: 'TechCrunch Funding', url: 'https://techcrunch.com/tag/funding/', type: 'news', confidence: 'high' },
  { name: 'VentureBeat Funding', url: 'https://venturebeat.com/category/business/deals/', type: 'news', confidence: 'high' },
  { name: 'Crunchbase Venture', url: 'https://news.crunchbase.com/venture/', type: 'news', confidence: 'high' },
  { name: 'Crunchbase Seed', url: 'https://news.crunchbase.com/seed/', type: 'news', confidence: 'high' },
]

const STARTUP_CRITERIA = {
  MAX_FUNDING_AMOUNT: 300000000,
  VALID_ROUND_TYPES: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'],
  EXCLUDED_COMPANIES: new Set([
    'stripe', 'airbnb', 'uber', 'lyft', 'doordash', 'instacart', 'coinbase',
    'robinhood', 'chime', 'plaid', 'discord', 'notion', 'figma', 'canva',
    'databricks', 'snowflake', 'palantir', 'slack', 'zoom', 'dropbox',
    'github', 'gitlab', 'atlassian', 'salesforce', 'oracle', 'microsoft',
    'google', 'amazon', 'meta', 'apple', 'nvidia', 'openai', 'anthropic',
    'groq', 'grok'
  ])
}

async function scrapeWithZyte(url: string, apiKey: string, mode: 'article' | 'browser'): Promise<unknown> {
  try {
    const body = mode === 'article' 
      ? { url, article: true, articleOptions: { extractFrom: 'browserHtml' } }
      : { url, browserHtml: true, javascript: true }
    
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      console.error(`Zyte API error: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return mode === 'article' ? data.article : data.browserHtml
  } catch (error) {
    console.error('Zyte scrape error:', error)
    return null
  }
}

function getArticleLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const patterns = [
    /<a[^>]+href=["']([^"']+(?:raises?|funding|series|seed|million|venture|backed)[^"']*)["'][^>]*>/gi,
    /<a[^>]+href=["'](https?:\/\/[^"']+\/20\d{2}\/\d{2}\/[^"']+)["'][^>]*>/gi
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null && links.length < 15) {
      let link = match[1]
      if (link.startsWith('/')) {
        const urlObj = new URL(baseUrl)
        link = `${urlObj.protocol}//${urlObj.host}${link}`
      }
      if (!links.includes(link) && link.includes('http')) {
        links.push(link)
      }
    }
  }
  return links.slice(0, 15) // Limit to 15 articles per source
}

function cleanCompanyName(rawName: string): string | null {
  let name = rawName.trim()
  
  const noisePatterns = [
    /^(?:the|a|an)\s+/i,
    /^(?:ai|ml|saas|fintech|healthtech|crypto|web3)\s+(?:startup|company|firm)\s+/i,
    /^(?:paris|london|berlin|new york|san francisco|austin|boston|seattle)[- ]?based\s+/i,
    /^(?:backed|funded|led|stealth)\s+/i,
  ]
  
  for (const pattern of noisePatterns) {
    name = name.replace(pattern, '')
  }
  
  name = name.replace(/\s+(?:startup|company|firm|inc\.?|llc\.?|corp\.?)$/i, '').trim()
  
  const words = name.split(/\s+/)
  const firstCapitalIdx = words.findIndex(w => w.length > 0 && /^[A-Z]/.test(w))
  if (firstCapitalIdx > 0) {
    name = words.slice(firstCapitalIdx).join(' ')
  }
  
  const nameWords = name.split(/\s+/).filter(w => w.length > 0)
  const validWords: string[] = []
  for (const word of nameWords) {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(word) || /^[A-Z]+$/.test(word)) {
      validWords.push(word)
      if (validWords.length >= 3) break
    } else if (validWords.length > 0) break
  }
  
  name = validWords.join(' ').trim()
  
  if (name.length < 2 || name.length > 40) return null
  if (!/^[A-Z]/.test(name)) return null
  if (STARTUP_CRITERIA.EXCLUDED_COMPANIES.has(name.toLowerCase().replace(/[^a-z0-9]/g, ''))) return null
  
  return name
}

function parseFundingFromArticle(article: ZyteArticle, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup | null {
  const content = `${article.headline || ''} ${article.articleBody || ''} ${article.description || ''}`
  
  const fundingPatterns = [
    /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})\s+(?:has\s+)?(?:raises?|secures?|closes?|announces?|gets?|lands?)\s+\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)/i,
    /\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)\s+(?:for|to|into|in)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})/i,
  ]
  
  let companyName: string | null = null
  let amount = 0
  let unit = 'm'
  
  for (const pattern of fundingPatterns) {
    const match = content.match(pattern)
    if (match) {
      if (pattern.source.startsWith('\\$')) {
        amount = parseFloat(match[1])
        unit = match[2].toLowerCase()
        companyName = cleanCompanyName(match[3])
      } else {
        companyName = cleanCompanyName(match[1])
        amount = parseFloat(match[2])
        unit = match[3].toLowerCase()
      }
      if (companyName) break
    }
  }
  
  if (!companyName || amount === 0) return null
  
  let fundingAmount = amount
  if (unit === 'billion' || unit === 'b') fundingAmount = amount * 1000000000
  else if (unit === 'million' || unit === 'm') fundingAmount = amount * 1000000
  
  if (fundingAmount > STARTUP_CRITERIA.MAX_FUNDING_AMOUNT) return null
  
  const contentLower = content.toLowerCase()
  let roundType = 'Seed'
  if (contentLower.includes('pre-seed') || contentLower.includes('preseed')) roundType = 'Pre-Seed'
  else if (contentLower.includes('series d') || contentLower.includes('series e') || contentLower.includes('series f')) roundType = 'Series D+'
  else if (contentLower.includes('series c')) roundType = 'Series C'
  else if (contentLower.includes('series b')) roundType = 'Series B'
  else if (contentLower.includes('series a')) roundType = 'Series A'
  
  if (!STARTUP_CRITERIA.VALID_ROUND_TYPES.includes(roundType)) return null
  
  const sectorKeywords: Record<string, string> = {
    'artificial intelligence': 'AI/ML', 'ai ': 'AI/ML', 'machine learning': 'AI/ML',
    'fintech': 'Fintech', 'financial': 'Fintech', 'payment': 'Fintech',
    'healthcare': 'Healthcare', 'health ': 'Healthcare', 'medical': 'Healthcare',
    'saas': 'SaaS', 'software': 'SaaS', 'cloud': 'SaaS',
    'ecommerce': 'E-commerce', 'e-commerce': 'E-commerce',
    'climate': 'Climate Tech', 'sustainability': 'Climate Tech',
    'enterprise': 'Enterprise', 'b2b': 'Enterprise',
    'consumer': 'Consumer', 'b2c': 'Consumer'
  }
  
  const sectors: string[] = []
  for (const [keyword, sector] of Object.entries(sectorKeywords)) {
    if (contentLower.includes(keyword) && !sectors.includes(sector)) sectors.push(sector)
  }
  if (sectors.length === 0) sectors.push('SaaS')
  
  const investorPattern = /(?:led by|from|backed by)\s+([A-Z][a-zA-Z\s&,]+)/i
  const investorMatch = content.match(investorPattern)
  const leadInvestors = investorMatch
    ? investorMatch[1].split(/,|and/).map(i => i.trim()).filter(i => i.length > 2 && i.length < 50).slice(0, 3)
    : []
  
  let city = 'San Francisco', country = 'USA'
  const cities: Record<string, { city: string; country: string }> = {
    'new york': { city: 'New York', country: 'USA' },
    'san francisco': { city: 'San Francisco', country: 'USA' },
    'austin': { city: 'Austin', country: 'USA' },
    'boston': { city: 'Boston', country: 'USA' },
    'seattle': { city: 'Seattle', country: 'USA' },
    'london': { city: 'London', country: 'UK' },
    'berlin': { city: 'Berlin', country: 'Germany' },
    'tel aviv': { city: 'Tel Aviv', country: 'Israel' },
    'paris': { city: 'Paris', country: 'France' },
  }
  
  for (const [key, loc] of Object.entries(cities)) {
    if (contentLower.includes(key)) {
      city = loc.city
      country = loc.country
      break
    }
  }
  
  let buzzScore = 50
  if (fundingAmount >= 100000000) buzzScore = 95
  else if (fundingAmount >= 50000000) buzzScore = 85
  else if (fundingAmount >= 20000000) buzzScore = 75
  else if (fundingAmount >= 10000000) buzzScore = 65
  else if (fundingAmount >= 5000000) buzzScore = 55
  if (confidence === 'high') buzzScore += 5
  
  let fundingDate = new Date().toISOString().split('T')[0]
  if (article.datePublished) {
    try { fundingDate = new Date(article.datePublished).toISOString().split('T')[0] } catch {}
  }
  
  const description = article.description && article.description.length > 50 
    ? article.description.slice(0, 300)
    : `${companyName} is a ${sectors[0]} company that recently raised $${amount}${unit.toUpperCase()} in ${roundType} funding.`
  
  return {
    name: companyName,
    description,
    eli5: `${companyName} builds technology in the ${sectors[0]} space and just raised $${amount}${unit.toUpperCase()} to grow their business.`,
    website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    sectors: sectors.slice(0, 3),
    city, country,
    funding_amount: fundingAmount,
    round_type: roundType,
    funding_date: fundingDate,
    lead_investors: leadInvestors,
    buzz_score: Math.min(buzzScore, 100),
    source_name: sourceName,
    source_url: article.url || sourceUrl,
    confidence
  }
}

// Normalize company name for duplicate detection
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(inc\.?|llc|corp\.?|ltd\.?|co\.?)$/i, '')
    .replace(/\s+(analytics|ai|labs|studio|tech|technologies|software|platform|health|bio|io)$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveStartup(supabase: any, startup: ScrapedStartup): Promise<{ saved: boolean; updated: boolean; id?: string; error?: string }> {
  try {
    const normalizedName = normalizeCompanyName(startup.name)
    
    // Check if startup already exists (exact match first)
    let { data: existing } = await supabase
      .from('startups')
      .select('id, name, total_raised, buzz_score')
      .eq('name', startup.name)
      .maybeSingle()
    
    // If no exact match, check for similar names (variations like "Plausible" vs "Plausible Analytics")
    if (!existing) {
      const { data: allStartups } = await supabase
        .from('startups')
        .select('id, name, total_raised, buzz_score')
      
      existing = allStartups?.find((s: { name: string }) => 
        normalizeCompanyName(s.name) === normalizedName
      )
      
      if (existing) {
        console.log(`Found similar company: "${startup.name}" matches existing "${existing.name}"`)
      }
    }
    
    if (existing) {
      // Update existing startup if new data is better (higher funding or buzz)
      const shouldUpdate = startup.funding_amount > (existing.total_raised || 0) || 
                          startup.buzz_score > (existing.buzz_score || 0)
      
      if (shouldUpdate) {
        await supabase
          .from('startups')
          .update({
            total_raised: Math.max(startup.funding_amount, existing.total_raised || 0),
            buzz_score: Math.max(startup.buzz_score, existing.buzz_score || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        // Add new funding round if amount is different
        if (startup.funding_amount > 0) {
          const { data: existingRound } = await supabase
            .from('funding_rounds')
            .select('id')
            .eq('startup_id', existing.id)
            .eq('amount', startup.funding_amount)
            .eq('round_type', startup.round_type)
            .maybeSingle()
          
          if (!existingRound) {
            await supabase.from('funding_rounds').insert({
              startup_id: existing.id,
              amount: startup.funding_amount,
              round_type: startup.round_type,
              date: startup.funding_date,
              lead_investors: startup.lead_investors
            })
          }
        }
        
        console.log('Updated: ' + startup.name + ' with new data')
        return { saved: false, updated: true, id: existing.id }
      }
      
      return { saved: false, updated: false, error: 'Already exists, no update needed' }
    }
    
    // Insert new startup
    const { data: newStartup, error: startupError } = await supabase
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
    
    if (startupError) {
      // Handle unique constraint violation gracefully
      if (startupError.code === '23505') {
        console.log('Duplicate detected for ' + startup.name + ', skipping')
        return { saved: false, updated: false, error: 'Duplicate' }
      }
      console.error('Error inserting ' + startup.name + ':', startupError)
      return { saved: false, updated: false, error: startupError.message }
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
    
    // The database trigger will automatically queue for enrichment!
    console.log('Saved: ' + startup.name + ' (auto-queued for enrichment)')
    return { saved: true, updated: false, id: newStartup.id }
  } catch (error) {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get source to scrape from request body or pick next in rotation
    const body = await req.json().catch(() => ({}))
    let sourceIndex = body.sourceIndex ?? 0
    
    if (sourceIndex >= ALL_SOURCES.length) {
      return new Response(
        JSON.stringify({ 
          message: 'All sources processed',
          totalSources: ALL_SOURCES.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const source = ALL_SOURCES[sourceIndex]
    console.log(`=== Scraping: ${source.name} ===`)
    
    // Log start
    const { data: logEntry } = await supabase
      .from('scrape_log')
      .insert({ source_name: source.name, source_url: source.url, status: 'started' })
      .select()
      .single()
    
    const startups: ScrapedStartup[] = []
    let saved = 0
    let updated = 0
    let skipped = 0
    
    // Get index page
    const indexHtml = await scrapeWithZyte(source.url, zyteApiKey, 'browser') as string | null
    if (!indexHtml) {
      await supabase.from('scrape_log').update({ 
        status: 'failed', 
        error_message: 'Failed to fetch index page',
        duration_ms: Date.now() - startTime
      }).eq('id', logEntry.id)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to scrape ' + source.name,
          nextSourceIndex: sourceIndex + 1
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get article links
    const articleLinks = getArticleLinks(indexHtml, source.url)
    console.log('Found ' + articleLinks.length + ' articles')
    
    // Process articles (limited to avoid timeout)
    for (const link of articleLinks.slice(0, 10)) {
      const article = await scrapeWithZyte(link, zyteApiKey, 'article') as ZyteArticle | null
      if (article) {
        const startup = parseFundingFromArticle(article, source.name, source.url, source.confidence)
        if (startup && !startups.some(s => s.name.toLowerCase() === startup.name.toLowerCase())) {
          startups.push(startup)
          const result = await saveStartup(supabase, startup)
          if (result.saved) saved++
          else if (result.updated) updated++
          else skipped++
        }
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Update log
    const duration = Date.now() - startTime
    await supabase.from('scrape_log').update({ 
      status: 'completed',
      startups_found: startups.length,
      startups_saved: saved,
      duration_ms: duration
    }).eq('id', logEntry.id)
    
    console.log('=== Completed: ' + saved + ' new, ' + updated + ' updated, ' + skipped + ' skipped, ' + duration + 'ms ===')
    
    return new Response(
      JSON.stringify({
        success: true,
        source: source.name,
        startupsFound: startups.length,
        startupsSaved: saved,
        startupsUpdated: updated,
        startupsSkipped: skipped,
        durationMs: duration,
        nextSourceIndex: sourceIndex + 1,
        hasMoreSources: sourceIndex + 1 < ALL_SOURCES.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

