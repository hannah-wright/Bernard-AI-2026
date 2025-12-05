import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void
}

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

interface ZyteResponse {
  url: string
  browserHtml?: string
  article?: ZyteArticle
}

interface ScrapedStartup {
  name: string
  description: string
  eli5: string
  website: string
  sectors: string[]
  city: string
  state?: string
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

const STARTUP_CRITERIA = {
  MAX_FUNDING_AMOUNT: 300000000,
  VALID_ROUND_TYPES: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'],
  EXCLUDED_COMPANIES: new Set([
    'stripe', 'airbnb', 'uber', 'lyft', 'doordash', 'instacart', 'coinbase',
    'robinhood', 'chime', 'plaid', 'discord', 'notion', 'figma', 'canva',
    'databricks', 'snowflake', 'palantir', 'slack', 'zoom', 'dropbox',
    'github', 'gitlab', 'atlassian', 'salesforce', 'oracle', 'microsoft',
    'google', 'amazon', 'meta', 'apple', 'nvidia', 'openai', 'anthropic',
    'grab', 'gojek', 'rappi', 'revolut', 'nubank', 'klarna', 'affirm',
    'mailchimp', 'hubspot', 'zendesk', 'twilio', 'sendgrid', 'shopify',
    'squarespace', 'wix', 'wordpress', 'godaddy', 'cloudflare', 'fastly',
    'monday.com', 'asana', 'trello', 'basecamp', 'zoho', 'freshworks'
  ])
}

const NEWS_SOURCES = [
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/', confidence: 'high' },
  { name: 'TechCrunch Funding', url: 'https://techcrunch.com/tag/funding/', confidence: 'high' },
  { name: 'VentureBeat Funding', url: 'https://venturebeat.com/category/business/deals/', confidence: 'high' },
  { name: 'Crunchbase News', url: 'https://news.crunchbase.com/venture/', confidence: 'high' },
  { name: 'TechCrunch Venture', url: 'https://techcrunch.com/category/venture/', confidence: 'high' }
]

const DIRECTORY_SOURCES = [
  { name: 'Product Hunt AI', url: 'https://www.producthunt.com/topics/artificial-intelligence', confidence: 'medium' },
  { name: 'Indie Hackers', url: 'https://www.indiehackers.com/products?revenue=5000-10000', confidence: 'medium' },
  { name: 'Starter Story', url: 'https://www.starterstory.com/ideas', confidence: 'medium' }
]

async function scrapeWithZyteArticle(url: string, apiKey: string): Promise<ZyteArticle | null> {
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify({
        url,
        article: true,
        articleOptions: { extractFrom: 'browserHtml' }
      })
    })
    if (!response.ok) return null
    const data: ZyteResponse = await response.json()
    return data.article || null
  } catch {
    return null
  }
}

async function scrapeWithZyteBrowser(url: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify({ url, browserHtml: true, javascript: true })
    })
    if (!response.ok) return null
    const data: ZyteResponse = await response.json()
    return data.browserHtml || null
  } catch {
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
    while ((match = pattern.exec(html)) !== null && links.length < 25) {
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
  return links.slice(0, 25)
}

function parseFundingFromArticle(article: ZyteArticle, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup | null {
  const content = `${article.headline || ''} ${article.articleBody || ''} ${article.description || ''}`
  
  const fundingPattern = /([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})\s*(?:,\s*(?:a|an|the)\s+[^,]+,\s*)?\s*(?:has\s+)?(?:raises?|secures?|closes?|announces?|gets?|lands?|bags?|nabs?|receives?)\s+\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)/i
  
  const match = content.match(fundingPattern)
  if (!match) return null
  
  const companyName = match[1].trim()
  const amount = parseFloat(match[2])
  const unit = match[3].toLowerCase()
  
  let fundingAmount = amount
  if (unit === 'billion' || unit === 'b') fundingAmount = amount * 1000000000
  else if (unit === 'million' || unit === 'm') fundingAmount = amount * 1000000
  
  if (companyName.length < 3 || STARTUP_CRITERIA.EXCLUDED_COMPANIES.has(companyName.toLowerCase().replace(/[^a-z0-9]/g, ''))) return null
  if (fundingAmount > STARTUP_CRITERIA.MAX_FUNDING_AMOUNT) return null
  
  const contentLower = content.toLowerCase()
  let roundType = 'Seed'
  if (contentLower.includes('pre-seed') || contentLower.includes('preseed')) roundType = 'Pre-Seed'
  else if (contentLower.includes('series d') || contentLower.includes('series e')) roundType = 'Series D+'
  else if (contentLower.includes('series c')) roundType = 'Series C'
  else if (contentLower.includes('series b')) roundType = 'Series B'
  else if (contentLower.includes('series a')) roundType = 'Series A'
  
  if (!STARTUP_CRITERIA.VALID_ROUND_TYPES.includes(roundType)) return null
  
  const sectorKeywords: Record<string, string> = {
    'artificial intelligence': 'AI/ML', 'ai': 'AI/ML', 'machine learning': 'AI/ML',
    'fintech': 'Fintech', 'financial': 'Fintech', 'payment': 'Fintech',
    'healthcare': 'Healthcare', 'health': 'Healthcare', 'medical': 'Healthcare',
    'saas': 'SaaS', 'software': 'SaaS', 'cloud': 'SaaS',
    'ecommerce': 'E-commerce', 'e-commerce': 'E-commerce', 'retail': 'E-commerce',
    'climate': 'Climate Tech', 'sustainability': 'Climate Tech',
    'enterprise': 'Enterprise', 'b2b': 'Enterprise',
    'consumer': 'Consumer', 'b2c': 'Consumer',
    'biotech': 'Biotech'
  }
  
  const sectors: string[] = []
  for (const [keyword, sector] of Object.entries(sectorKeywords)) {
    if (contentLower.includes(keyword) && !sectors.includes(sector)) sectors.push(sector)
  }
  if (sectors.length === 0) sectors.push('SaaS')
  
  const investorPattern = /(?:led by|from|backed by|investors? include)\s+([A-Z][a-zA-Z\s&,]+)/i
  const investorMatch = content.match(investorPattern)
  const leadInvestors = investorMatch
    ? investorMatch[1].split(/,|and/).map(i => i.trim()).filter(i => i.length > 2 && i.length < 50).slice(0, 3)
    : []
  
  let city = 'San Francisco', country = 'USA'
  const cityMatch = content.match(/\b(New York|San Francisco|Los Angeles|Austin|Boston|Seattle|Chicago|Denver|Miami|London|Berlin|Tel Aviv|Singapore|Toronto)\b/i)
  if (cityMatch) city = cityMatch[1]
  
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
  
  return {
    name: companyName,
    description: article.description || `${companyName} is a ${sectors[0]} company that recently raised ${roundType} funding.`,
    eli5: `${companyName} builds technology in the ${sectors[0]} space and just raised $${amount}${unit.toUpperCase()} to grow.`,
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

function parseDirectoryStartups(html: string, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup[] {
  const startups: ScrapedStartup[] = []
  const bootstrappedPattern = /([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,2})[\s\S]{0,200}?(?:\$(\d+(?:,\d{3})*(?:\.\d+)?)[kK]?\s*(?:\/mo|MRR|ARR|revenue))/gi
  
  let match
  while ((match = bootstrappedPattern.exec(html)) !== null && startups.length < 15) {
    const name = match[1].trim()
    if (name.length < 3 || name.length > 40) continue
    if (STARTUP_CRITERIA.EXCLUDED_COMPANIES.has(name.toLowerCase().replace(/[^a-z0-9]/g, ''))) continue
    if (startups.some(s => s.name.toLowerCase() === name.toLowerCase())) continue
    
    startups.push({
      name,
      description: `${name} is a bootstrapped company with demonstrated revenue and traction.`,
      eli5: `${name} makes money without outside investors - growing from their own revenue.`,
      website: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      sectors: ['SaaS'],
      city: 'San Francisco', country: 'USA',
      funding_amount: 0,
      round_type: 'Bootstrapped',
      funding_date: new Date().toISOString().split('T')[0],
      lead_investors: [],
      buzz_score: 45,
      source_name: sourceName,
      source_url: sourceUrl,
      confidence
    })
  }
  return startups
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveStartupsToDatabase(supabase: any, startups: ScrapedStartup[]): Promise<{ saved: number; errors: number; newStartupIds: string[] }> {
  let saved = 0, errors = 0
  const newStartupIds: string[] = []
  
  for (const startup of startups) {
    try {
      const { data: existing } = await supabase
        .from('startups')
        .select('id, total_raised')
        .eq('name', startup.name)
        .maybeSingle()
      
      if (existing) {
        if (existing.total_raised && existing.total_raised > STARTUP_CRITERIA.MAX_FUNDING_AMOUNT) continue
        
        const { data: existingRounds } = await supabase
          .from('funding_rounds')
          .select('amount, round_type')
          .eq('startup_id', existing.id)
          .order('date', { ascending: false })
          .limit(1)
        
        const latestRound = existingRounds?.[0]
        const isNewRound = !latestRound || latestRound.amount !== startup.funding_amount || latestRound.round_type !== startup.round_type
        
        if (isNewRound && startup.funding_amount > 0) {
          await supabase.from('funding_rounds').insert({
            startup_id: existing.id,
            amount: startup.funding_amount,
            round_type: startup.round_type,
            date: startup.funding_date,
            lead_investors: startup.lead_investors
          })
          
          await supabase.from('startups').update({ 
            buzz_score: Math.max(startup.buzz_score, 50),
            total_raised: (existing.total_raised || 0) + startup.funding_amount,
            updated_at: new Date().toISOString()
          }).eq('id', existing.id)
          
          await supabase.from('data_sources').insert({
            startup_id: existing.id,
            name: startup.source_name,
            url: startup.source_url,
            confidence: startup.confidence
          })
          saved++
        }
        continue
      }
      
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
      
      if (startupError) { errors++; continue }
      
      newStartupIds.push(newStartup.id)
      
      if (startup.funding_amount > 0) {
        await supabase.from('funding_rounds').insert({
          startup_id: newStartup.id,
          amount: startup.funding_amount,
          round_type: startup.round_type,
          date: startup.funding_date,
          lead_investors: startup.lead_investors
        })
      }
      
      await supabase.from('data_sources').insert({
        startup_id: newStartup.id,
        name: startup.source_name,
        url: startup.source_url,
        confidence: startup.confidence
      })
      
      saved++
      console.log(`Saved: ${startup.name} (${startup.round_type}, $${startup.funding_amount / 1000000}M)`)
    } catch (error) {
      console.error(`Error processing ${startup.name}:`, error)
      errors++
    }
  }
  
  return { saved, errors, newStartupIds }
}

async function triggerEnrichment(supabaseUrl: string, startupIds: string[]): Promise<void> {
  if (startupIds.length === 0) return
  console.log(`Triggering enrichment for ${startupIds.length} startups...`)
  
  try {
    await fetch(`${supabaseUrl}/functions/v1/enrich-startup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ startupIds })
    })
  } catch (error) {
    console.error('Failed to trigger enrichment:', error)
  }
}

// Background scraping task
async function runScrapingTask(zyteApiKey: string, supabaseUrl: string, supabaseServiceKey: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const allStartups: ScrapedStartup[] = []
  let articlesProcessed = 0
  
  console.log('Background scraping started...')
  
  // Process news sources
  for (const source of NEWS_SOURCES) {
    console.log(`Processing: ${source.name}`)
    
    const indexHtml = await scrapeWithZyteBrowser(source.url, zyteApiKey)
    if (!indexHtml) continue
    
    const articleLinks = getArticleLinks(indexHtml, source.url)
    console.log(`Found ${articleLinks.length} articles from ${source.name}`)
    
    for (const link of articleLinks.slice(0, 15)) {
      const article = await scrapeWithZyteArticle(link, zyteApiKey)
      if (article) {
        articlesProcessed++
        const startup = parseFundingFromArticle(article, source.name, source.url, source.confidence)
        if (startup && !allStartups.some(s => s.name.toLowerCase() === startup.name.toLowerCase())) {
          allStartups.push(startup)
          console.log(`Found: ${startup.name} (${startup.round_type}, $${startup.funding_amount / 1000000}M)`)
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  // Process directory sources
  for (const source of DIRECTORY_SOURCES) {
    console.log(`Processing directory: ${source.name}`)
    const html = await scrapeWithZyteBrowser(source.url, zyteApiKey)
    if (!html) continue
    
    const startups = parseDirectoryStartups(html, source.name, source.url, source.confidence)
    for (const startup of startups) {
      if (!allStartups.some(s => s.name.toLowerCase() === startup.name.toLowerCase())) {
        allStartups.push(startup)
      }
    }
  }
  
  console.log(`Total startups found: ${allStartups.length}`)
  
  const { saved, errors, newStartupIds } = await saveStartupsToDatabase(supabase, allStartups)
  
  if (newStartupIds.length > 0) {
    await triggerEnrichment(supabaseUrl, newStartupIds)
  }
  
  console.log(`Background scraping completed: ${saved} saved, ${errors} errors, ${articlesProcessed} articles processed`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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

    // Start background task and return immediately
    EdgeRuntime.waitUntil(runScrapingTask(zyteApiKey, supabaseUrl, supabaseServiceKey))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scraping task started in background',
        sources: {
          news: NEWS_SOURCES.map(s => s.name),
          directories: DIRECTORY_SOURCES.map(s => s.name)
        },
        criteria: {
          max_funding: STARTUP_CRITERIA.MAX_FUNDING_AMOUNT,
          valid_rounds: STARTUP_CRITERIA.VALID_ROUND_TYPES
        }
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
