import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors.ts"

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void
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
  ]),
  // Words that should not be part of company names
  NOISE_WORDS: new Set([
    'startup', 'company', 'firm', 'platform', 'service', 'provider', 'maker',
    'ai', 'ml', 'saas', 'fintech', 'healthtech', 'edtech', 'proptech',
    'based', 'backed', 'funded', 'led', 'paris', 'london', 'berlin', 'new york',
    'san francisco', 'seattle', 'austin', 'boston', 'voice', 'video', 'data',
    'cloud', 'cyber', 'security', 'analytics', 'automation', 'intelligence'
  ])
}

const NEWS_SOURCES = [
  // US Tech News
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/', confidence: 'high' },
  { name: 'TechCrunch Funding', url: 'https://techcrunch.com/tag/funding/', confidence: 'high' },
  { name: 'TechCrunch Venture', url: 'https://techcrunch.com/category/venture/', confidence: 'high' },
  { name: 'VentureBeat Funding', url: 'https://venturebeat.com/category/business/deals/', confidence: 'high' },
  { name: 'Crunchbase Venture', url: 'https://news.crunchbase.com/venture/', confidence: 'high' },
  { name: 'Crunchbase Seed', url: 'https://news.crunchbase.com/seed/', confidence: 'high' },
  
  // EU & International
  { name: 'EU Startups Funding', url: 'https://www.eu-startups.com/category/funding/', confidence: 'medium' },
  { name: 'Sifted', url: 'https://sifted.eu/articles/', confidence: 'medium' },
]

const DIRECTORY_SOURCES = [
  // Product Launch Platforms
  { name: 'Product Hunt AI', url: 'https://www.producthunt.com/topics/artificial-intelligence', confidence: 'medium' },
  { name: 'Product Hunt SaaS', url: 'https://www.producthunt.com/topics/software-as-a-service', confidence: 'medium' },
  
  // Bootstrapped / Indie Startup Sources
  { name: 'Indie Hackers Products', url: 'https://www.indiehackers.com/products?revenue=5000-10000', confidence: 'medium' },
  { name: 'Indie Hackers Interviews', url: 'https://www.indiehackers.com/interviews', confidence: 'high' },
  { name: 'Starter Story', url: 'https://www.starterstory.com/stories', confidence: 'high' },
  { name: 'Starter Story Ideas', url: 'https://www.starterstory.com/ideas', confidence: 'medium' },
  { name: 'Startups Gallery', url: 'https://startups.gallery/', confidence: 'medium' },
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
    while ((match = pattern.exec(html)) !== null && links.length < 30) {
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
  return links.slice(0, 30)
}

// Clean and extract company name from messy text
function cleanCompanyName(rawName: string): string | null {
  let name = rawName.trim()
  
  // Common noise patterns to remove (order matters - more specific first)
  const noisePatterns = [
    /^(?:the|a|an)\s+/i,
    /^(?:ai|ml|saas|fintech|healthtech|crypto|web3)\s+(?:voice|video|data|cloud|cyber)?\s*(?:startup|company|firm|platform|provider|maker)\s+/i,
    /^(?:paris|london|berlin|new york|san francisco|austin|boston|seattle|chicago|tel aviv|singapore|toronto|amsterdam|stockholm|dublin|tokyo|sydney|mumbai|bangalore)[- ]?based\s+/i,
    /^(?:backed|funded|led|stealth)\s+/i,
    /^(?:startup|company|firm|platform)\s+/i,
    /^(?:ai|ml|voice|video|data|cloud|cyber|security|analytics)\s+(?:startup|company|firm)\s+/i,
  ]
  
  for (const pattern of noisePatterns) {
    name = name.replace(pattern, '')
  }
  
  // Remove trailing noise
  name = name.replace(/\s+(?:startup|company|firm|platform|inc\.?|llc\.?|corp\.?|labs?)$/i, '')
  name = name.trim()
  
  // If name still starts with lowercase word, find the capitalized name
  const words = name.split(/\s+/)
  const firstCapitalIdx = words.findIndex(w => w.length > 0 && /^[A-Z]/.test(w))
  if (firstCapitalIdx > 0) {
    name = words.slice(firstCapitalIdx).join(' ')
  }
  
  // Take only the first 1-3 words that look like a company name (capitalized)
  const nameWords = name.split(/\s+/).filter(w => w.length > 0)
  const validWords: string[] = []
  for (const word of nameWords) {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(word) || /^[A-Z]+$/.test(word)) {
      validWords.push(word)
      if (validWords.length >= 3) break
    } else if (validWords.length > 0) {
      break // Stop at first non-name word after we've started
    }
  }
  
  name = validWords.join(' ').trim()
  
  // Final validation
  if (name.length < 2 || name.length > 40) return null
  if (!/^[A-Z]/.test(name)) return null
  if (STARTUP_CRITERIA.EXCLUDED_COMPANIES.has(name.toLowerCase().replace(/[^a-z0-9]/g, ''))) return null
  
  // Reject generic noise words as names
  const genericNames = ['ai', 'ml', 'saas', 'startup', 'company', 'platform', 'tech', 'labs', 'ventures', 'capital', 'partners', 'group', 'solutions', 'services', 'technologies', 'agents']
  if (genericNames.includes(name.toLowerCase())) return null
  
  return name
}

function parseFundingFromArticle(article: ZyteArticle, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup | null {
  const content = `${article.headline || ''} ${article.articleBody || ''} ${article.description || ''}`
  
  // Multiple patterns to catch different announcement formats
  const fundingPatterns = [
    // "CompanyName raises $X million"
    /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})\s+(?:has\s+)?(?:raises?|secures?|closes?|announces?|gets?|lands?|bags?|nabs?|receives?|raised)\s+\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)/i,
    // "$X million for CompanyName" or "backs CompanyName with $X"
    /\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)\s+(?:for|to|into|in)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})/i,
    // "CompanyName, the/a XYZ startup, raises"
    /([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2}),\s*(?:the|a|an)\s+[^,]+,\s*(?:raises?|secures?)\s+\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)/i,
    // Looser pattern: "startup CompanyName" followed by funding
    /(?:startup|company)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})[\s\S]{0,50}?\$(\d+(?:\.\d+)?)\s*(million|billion|M|B|m|b)/i
  ]
  
  let companyName: string | null = null
  let amount = 0
  let unit = 'm'
  
  for (const pattern of fundingPatterns) {
    const match = content.match(pattern)
    if (match) {
      // Pattern 2 has different group order
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
  
  // Convert to actual amount
  let fundingAmount = amount
  if (unit === 'billion' || unit === 'b') fundingAmount = amount * 1000000000
  else if (unit === 'million' || unit === 'm') fundingAmount = amount * 1000000
  
  if (fundingAmount > STARTUP_CRITERIA.MAX_FUNDING_AMOUNT) return null
  
  // Detect round type
  const contentLower = content.toLowerCase()
  let roundType = 'Seed'
  if (contentLower.includes('pre-seed') || contentLower.includes('preseed')) roundType = 'Pre-Seed'
  else if (contentLower.includes('series d') || contentLower.includes('series e') || contentLower.includes('series f')) roundType = 'Series D+'
  else if (contentLower.includes('series c')) roundType = 'Series C'
  else if (contentLower.includes('series b')) roundType = 'Series B'
  else if (contentLower.includes('series a')) roundType = 'Series A'
  
  if (!STARTUP_CRITERIA.VALID_ROUND_TYPES.includes(roundType)) return null
  
  // Detect sectors
  const sectorKeywords: Record<string, string> = {
    'artificial intelligence': 'AI/ML', 'ai ': 'AI/ML', 'machine learning': 'AI/ML', ' ml ': 'AI/ML',
    'fintech': 'Fintech', 'financial': 'Fintech', 'payment': 'Fintech', 'banking': 'Fintech',
    'healthcare': 'Healthcare', 'health ': 'Healthcare', 'medical': 'Healthcare', 'biotech': 'Biotech',
    'saas': 'SaaS', 'software': 'SaaS', 'cloud': 'SaaS',
    'ecommerce': 'E-commerce', 'e-commerce': 'E-commerce', 'retail': 'E-commerce',
    'climate': 'Climate Tech', 'sustainability': 'Climate Tech', 'clean energy': 'Climate Tech',
    'enterprise': 'Enterprise', 'b2b': 'Enterprise',
    'consumer': 'Consumer', 'b2c': 'Consumer'
  }
  
  const sectors: string[] = []
  for (const [keyword, sector] of Object.entries(sectorKeywords)) {
    if (contentLower.includes(keyword) && !sectors.includes(sector)) sectors.push(sector)
  }
  if (sectors.length === 0) sectors.push('SaaS')
  
  // Extract investors
  const investorPattern = /(?:led by|from|backed by|investors? include|with participation from)\s+([A-Z][a-zA-Z\s&,]+)/i
  const investorMatch = content.match(investorPattern)
  const leadInvestors = investorMatch
    ? investorMatch[1].split(/,|and/).map(i => i.trim()).filter(i => i.length > 2 && i.length < 50).slice(0, 3)
    : []
  
  // Detect location
  let city = 'San Francisco', country = 'USA'
  const locationPatterns: Array<{ pattern: RegExp; cities: Record<string, { city: string; country: string }> }> = [
    {
      pattern: /\b(New York|San Francisco|Los Angeles|Austin|Boston|Seattle|Chicago|Denver|Miami|London|Berlin|Tel Aviv|Singapore|Toronto|Paris|Amsterdam|Stockholm|Dublin|Mumbai|Bangalore|Sydney|Tokyo)\b/i,
      cities: {
        'new york': { city: 'New York', country: 'USA' },
        'san francisco': { city: 'San Francisco', country: 'USA' },
        'los angeles': { city: 'Los Angeles', country: 'USA' },
        'austin': { city: 'Austin', country: 'USA' },
        'boston': { city: 'Boston', country: 'USA' },
        'seattle': { city: 'Seattle', country: 'USA' },
        'chicago': { city: 'Chicago', country: 'USA' },
        'denver': { city: 'Denver', country: 'USA' },
        'miami': { city: 'Miami', country: 'USA' },
        'london': { city: 'London', country: 'UK' },
        'berlin': { city: 'Berlin', country: 'Germany' },
        'tel aviv': { city: 'Tel Aviv', country: 'Israel' },
        'singapore': { city: 'Singapore', country: 'Singapore' },
        'toronto': { city: 'Toronto', country: 'Canada' },
        'paris': { city: 'Paris', country: 'France' },
        'amsterdam': { city: 'Amsterdam', country: 'Netherlands' },
        'stockholm': { city: 'Stockholm', country: 'Sweden' },
        'dublin': { city: 'Dublin', country: 'Ireland' },
        'mumbai': { city: 'Mumbai', country: 'India' },
        'bangalore': { city: 'Bangalore', country: 'India' },
        'sydney': { city: 'Sydney', country: 'Australia' },
        'tokyo': { city: 'Tokyo', country: 'Japan' }
      }
    }
  ]
  
  for (const { pattern, cities } of locationPatterns) {
    const match = content.match(pattern)
    if (match) {
      const found = cities[match[1].toLowerCase()]
      if (found) {
        city = found.city
        country = found.country
        break
      }
    }
  }
  
  // Calculate buzz score
  let buzzScore = 50
  if (fundingAmount >= 100000000) buzzScore = 95
  else if (fundingAmount >= 50000000) buzzScore = 85
  else if (fundingAmount >= 20000000) buzzScore = 75
  else if (fundingAmount >= 10000000) buzzScore = 65
  else if (fundingAmount >= 5000000) buzzScore = 55
  if (confidence === 'high') buzzScore += 5
  
  // Use article date if available
  let fundingDate = new Date().toISOString().split('T')[0]
  if (article.datePublished) {
    try { fundingDate = new Date(article.datePublished).toISOString().split('T')[0] } catch {}
  }
  
  // Generate better description from article
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

function parseDirectoryStartups(html: string, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup[] {
  const startups: ScrapedStartup[] = []
  
  // Look for product/startup names with revenue indicators
  const patterns = [
    /class="[^"]*(?:product|startup|company)[^"]*"[^>]*>[\s\S]{0,100}?<[^>]+>([A-Z][a-zA-Z0-9\s]{2,30})<\/[^>]+>[\s\S]{0,300}?(?:\$[\d,]+|revenue|mrr|arr)/gi,
    /<h[23][^>]*>([A-Z][a-zA-Z0-9\s]{2,30})<\/h[23]>[\s\S]{0,300}?(?:\$[\d,]+(?:k|K|\/mo)?|revenue|mrr|arr)/gi
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null && startups.length < 15) {
      const name = cleanCompanyName(match[1])
      if (!name) continue
      if (startups.some(s => s.name.toLowerCase() === name.toLowerCase())) continue
      
      startups.push({
        name,
        description: `${name} is a bootstrapped company with demonstrated revenue and market traction.`,
        eli5: `${name} makes money without outside investors - they're growing from their own revenue.`,
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
          console.log(`Updated existing startup: ${startup.name} with new round`)
        }
        continue
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
        console.error(`Error inserting ${startup.name}:`, startupError)
        errors++
        continue
      }
      
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
      console.log(`Saved new startup: ${startup.name} (${startup.round_type}, $${startup.funding_amount / 1000000}M)`)
    } catch (error) {
      console.error(`Error processing ${startup.name}:`, error)
      errors++
    }
  }
  
  return { saved, errors, newStartupIds }
}

async function triggerEnrichment(supabaseUrl: string, startupIds: string[]): Promise<void> {
  if (startupIds.length === 0) return
  console.log(`Triggering AI enrichment for ${startupIds.length} new startups...`)
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/enrich-startup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ startupIds })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`Enrichment result:`, result)
    } else {
      console.error('Enrichment failed:', await response.text())
    }
  } catch (error) {
    console.error('Failed to trigger enrichment:', error)
  }
}

// Background scraping task
async function runScrapingTask(zyteApiKey: string, supabaseUrl: string, supabaseServiceKey: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const allStartups: ScrapedStartup[] = []
  let articlesProcessed = 0
  
  console.log('=== Background scraping started ===')
  console.log(`Processing ${NEWS_SOURCES.length} news sources and ${DIRECTORY_SOURCES.length} directory sources`)
  
  // Process news sources
  for (const source of NEWS_SOURCES) {
    console.log(`\nProcessing: ${source.name}`)
    
    const indexHtml = await scrapeWithZyteBrowser(source.url, zyteApiKey)
    if (!indexHtml) {
      console.log(`Failed to scrape index page for ${source.name}`)
      continue
    }
    
    const articleLinks = getArticleLinks(indexHtml, source.url)
    console.log(`Found ${articleLinks.length} articles from ${source.name}`)
    
    for (const link of articleLinks.slice(0, 20)) {
      const article = await scrapeWithZyteArticle(link, zyteApiKey)
      if (article) {
        articlesProcessed++
        const startup = parseFundingFromArticle(article, source.name, source.url, source.confidence)
        if (startup && !allStartups.some(s => s.name.toLowerCase() === startup.name.toLowerCase())) {
          allStartups.push(startup)
          console.log(`✓ Found: ${startup.name} (${startup.round_type}, $${startup.funding_amount / 1000000}M, ${startup.city})`)
        }
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  // Process directory sources
  for (const source of DIRECTORY_SOURCES) {
    console.log(`\nProcessing directory: ${source.name}`)
    const html = await scrapeWithZyteBrowser(source.url, zyteApiKey)
    if (!html) continue
    
    const startups = parseDirectoryStartups(html, source.name, source.url, source.confidence)
    for (const startup of startups) {
      if (!allStartups.some(s => s.name.toLowerCase() === startup.name.toLowerCase())) {
        allStartups.push(startup)
        console.log(`✓ Found bootstrapped: ${startup.name}`)
      }
    }
  }
  
  console.log(`\n=== Scraping complete: ${allStartups.length} startups found from ${articlesProcessed} articles ===`)
  
  // Save to database
  const { saved, errors, newStartupIds } = await saveStartupsToDatabase(supabase, allStartups)
  console.log(`Database: ${saved} saved, ${errors} errors`)
  
  // Trigger enrichment for ALL new startups
  if (newStartupIds.length > 0) {
    console.log(`\n=== Triggering VC intelligence enrichment for ${newStartupIds.length} startups ===`)
    await triggerEnrichment(supabaseUrl, newStartupIds)
  }
  
  console.log(`\n=== Background task complete ===`)
}

Deno.serve(async (req) => {
  const preflightResponse = handleCorsPrelight(req)
  if (preflightResponse) return preflightResponse
  
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"))

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
        message: 'Scraping task started in background. New startups will be automatically enriched with VC intelligence.',
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
