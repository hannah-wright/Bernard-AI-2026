import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZyteResponse {
  url: string
  httpResponseBody?: string
  browserHtml?: string
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
  estimated_revenue?: string
  estimated_size?: string
  buzz_score: number
  source_name: string
  source_url: string
  confidence: string
}

const TECH_NEWS_SOURCES = [
  {
    name: 'TechCrunch Startups',
    url: 'https://techcrunch.com/category/startups/',
    confidence: 'high'
  },
  {
    name: 'VentureBeat Funding',
    url: 'https://venturebeat.com/category/business/deals/',
    confidence: 'high'
  },
  {
    name: 'Startups.gallery',
    url: 'https://startups.gallery/',
    confidence: 'medium'
  },
  {
    name: 'Starter Story',
    url: 'https://www.starterstory.com/ideas',
    confidence: 'medium'
  },
  {
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com/products',
    confidence: 'medium'
  },
  {
    name: 'Wellfound (AngelList)',
    url: 'https://wellfound.com/startups',
    confidence: 'high'
  },
  {
    name: 'Wellfound Funding',
    url: 'https://wellfound.com/discover/recently-funded',
    confidence: 'high'
  }
]

async function scrapeWithZyte(url: string, apiKey: string): Promise<string | null> {
  console.log(`Scraping URL: ${url}`)
  
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify({
        url: url,
        browserHtml: true,
        javascript: true
      })
    })

    if (!response.ok) {
      console.error(`Zyte API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`Error details: ${errorText}`)
      return null
    }

    const data: ZyteResponse = await response.json()
    console.log(`Successfully scraped ${url}`)
    return data.browserHtml || null
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

function parseStartupData(html: string, sourceName: string, sourceUrl: string, confidence: string): ScrapedStartup[] {
  const startups: ScrapedStartup[] = []
  
  // Pattern for company raises funding
  const companyNamePattern = /([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)*)\s+(?:raises?|secures?|closes?|announces?|gets?)\s+\$(\d+(?:\.\d+)?)\s*(million|billion|M|B)/gi
  
  // Extract round types
  const roundTypes = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+']
  
  // Parse article content for funding news
  const articleMatches = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || []
  const headlineMatches = html.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi) || []
  
  const allContent = [...articleMatches, ...headlineMatches].join(' ')
  
  // Find company funding mentions
  let match
  while ((match = companyNamePattern.exec(allContent)) !== null) {
    const companyName = match[1].trim()
    const amount = parseFloat(match[2])
    const unit = match[3].toLowerCase()
    
    // Convert to actual amount
    let fundingAmount = amount
    if (unit === 'billion' || unit === 'b') {
      fundingAmount = amount * 1000000000
    } else if (unit === 'million' || unit === 'm') {
      fundingAmount = amount * 1000000
    }
    
    // Skip if company name is too generic or too short
    if (companyName.length < 3 || /^(The|A|An|This|That|Company|Startup)$/i.test(companyName)) {
      continue
    }
    
    // Detect round type from context
    let detectedRound = 'Seed'
    const contextStart = Math.max(0, match.index - 200)
    const contextEnd = Math.min(allContent.length, match.index + 200)
    const context = allContent.substring(contextStart, contextEnd).toLowerCase()
    
    for (const round of roundTypes) {
      if (context.includes(round.toLowerCase())) {
        detectedRound = round
        break
      }
    }
    
    // Detect sectors from context
    const sectorKeywords: Record<string, string> = {
      'artificial intelligence': 'AI/ML',
      'ai': 'AI/ML',
      'machine learning': 'AI/ML',
      'fintech': 'Fintech',
      'financial': 'Fintech',
      'payment': 'Fintech',
      'healthcare': 'Healthcare',
      'health': 'Healthcare',
      'medical': 'Healthcare',
      'saas': 'SaaS',
      'software': 'SaaS',
      'cloud': 'SaaS',
      'ecommerce': 'E-commerce',
      'e-commerce': 'E-commerce',
      'retail': 'E-commerce',
      'biotech': 'Biotech',
      'biotechnology': 'Biotech',
      'climate': 'Climate Tech',
      'sustainability': 'Climate Tech',
      'green': 'Climate Tech',
      'enterprise': 'Enterprise',
      'b2b': 'Enterprise',
      'consumer': 'Consumer',
      'b2c': 'Consumer'
    }
    
    const detectedSectors: string[] = []
    for (const [keyword, sector] of Object.entries(sectorKeywords)) {
      if (context.includes(keyword) && !detectedSectors.includes(sector)) {
        detectedSectors.push(sector)
      }
    }
    
    if (detectedSectors.length === 0) {
      detectedSectors.push('SaaS') // Default sector
    }
    
    // Extract investors if mentioned
    const investorPattern = /(?:led by|from|backed by|investors? include)\s+([A-Z][a-zA-Z\s&,]+)/i
    const investorMatch = context.match(investorPattern)
    const leadInvestors = investorMatch 
      ? investorMatch[1].split(/,|and/).map(i => i.trim()).filter(i => i.length > 2).slice(0, 3)
      : []
    
    // Calculate buzz score based on funding amount
    let buzzScore = 50
    if (fundingAmount >= 100000000) buzzScore = 95
    else if (fundingAmount >= 50000000) buzzScore = 85
    else if (fundingAmount >= 20000000) buzzScore = 75
    else if (fundingAmount >= 10000000) buzzScore = 65
    else if (fundingAmount >= 5000000) buzzScore = 55
    
    if (confidence === 'verified') buzzScore += 5
    else if (confidence === 'high') buzzScore += 3
    
    startups.push({
      name: companyName,
      description: `${companyName} is a ${detectedSectors[0]} company that recently raised funding.`,
      eli5: `${companyName} is building technology in the ${detectedSectors[0]} space and just got investment money to grow.`,
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      sectors: detectedSectors,
      city: 'San Francisco',
      country: 'USA',
      funding_amount: fundingAmount,
      round_type: detectedRound,
      funding_date: new Date().toISOString().split('T')[0],
      lead_investors: leadInvestors,
      buzz_score: Math.min(buzzScore, 100),
      source_name: sourceName,
      source_url: sourceUrl,
      confidence: confidence
    })
  }
  
  console.log(`Parsed ${startups.length} startups from ${sourceName}`)
  return startups
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveStartupsToDatabase(supabase: any, startups: ScrapedStartup[]): Promise<{ saved: number; errors: number }> {
  let saved = 0
  let errors = 0
  
  for (const startup of startups) {
    try {
      // Check if startup already exists
      const { data: existing } = await supabase
        .from('startups')
        .select('id')
        .eq('name', startup.name)
        .single()
      
      if (existing) {
        // Check if this is a new funding round for existing startup
        const { data: existingRounds } = await supabase
          .from('funding_rounds')
          .select('amount, round_type, date')
          .eq('startup_id', existing.id)
          .order('date', { ascending: false })
          .limit(1)
        
        const latestRound = existingRounds?.[0]
        const isNewRound = !latestRound || 
          latestRound.amount !== startup.funding_amount ||
          latestRound.round_type !== startup.round_type
        
        if (isNewRound && startup.funding_amount > 0) {
          console.log(`New funding round detected for ${startup.name}, adding...`)
          
          // Add new funding round
          const { error: fundingError } = await supabase
            .from('funding_rounds')
            .insert({
              startup_id: existing.id,
              amount: startup.funding_amount,
              round_type: startup.round_type,
              date: startup.funding_date,
              lead_investors: startup.lead_investors
            })
          
          if (!fundingError) {
            // Update buzz score and timestamp
            await supabase
              .from('startups')
              .update({ 
                buzz_score: Math.max(startup.buzz_score, 50),
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
            
            // Add data source for new round
            await supabase
              .from('data_sources')
              .insert({
                startup_id: existing.id,
                name: startup.source_name,
                url: startup.source_url,
                confidence: startup.confidence
              })
            
            saved++
            console.log(`Added new funding round for: ${startup.name}`)
          }
        } else {
          console.log(`Startup ${startup.name} already exists with same round, skipping`)
        }
        continue
      }
      
      // Insert startup
      const { data: newStartup, error: startupError } = await supabase
        .from('startups')
        .insert({
          name: startup.name,
          description: startup.description,
          eli5: startup.eli5,
          website: startup.website,
          sectors: startup.sectors,
          city: startup.city,
          state: startup.state,
          country: startup.country,
          estimated_revenue: startup.estimated_revenue,
          estimated_size: startup.estimated_size,
          buzz_score: startup.buzz_score
        })
        .select()
        .single()
      
      if (startupError) {
        console.error(`Error inserting startup ${startup.name}:`, startupError)
        errors++
        continue
      }
      
      // Insert funding round
      const { error: fundingError } = await supabase
        .from('funding_rounds')
        .insert({
          startup_id: newStartup.id,
          amount: startup.funding_amount,
          round_type: startup.round_type,
          date: startup.funding_date,
          lead_investors: startup.lead_investors
        })
      
      if (fundingError) {
        console.error(`Error inserting funding round for ${startup.name}:`, fundingError)
      }
      
      // Insert data source
      const { error: sourceError } = await supabase
        .from('data_sources')
        .insert({
          startup_id: newStartup.id,
          name: startup.source_name,
          url: startup.source_url,
          confidence: startup.confidence
        })
      
      if (sourceError) {
        console.error(`Error inserting data source for ${startup.name}:`, sourceError)
      }
      
      saved++
      console.log(`Saved startup: ${startup.name}`)
    } catch (error) {
      console.error(`Error processing startup ${startup.name}:`, error)
      errors++
    }
  }
  
  return { saved, errors }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const zyteApiKey = Deno.env.get('ZYTE_API_KEY')
    if (!zyteApiKey) {
      console.error('ZYTE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Zyte API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting startup scraping job...')
    
    const allStartups: ScrapedStartup[] = []
    
    // Scrape each source
    for (const source of TECH_NEWS_SOURCES) {
      console.log(`Processing source: ${source.name}`)
      const html = await scrapeWithZyte(source.url, zyteApiKey)
      
      if (html) {
        const startups = parseStartupData(html, source.name, source.url, source.confidence)
        allStartups.push(...startups)
      }
    }
    
    console.log(`Total startups found: ${allStartups.length}`)
    
    // Remove duplicates by name
    const uniqueStartups = allStartups.filter((startup, index, self) =>
      index === self.findIndex(s => s.name.toLowerCase() === startup.name.toLowerCase())
    )
    
    console.log(`Unique startups after deduplication: ${uniqueStartups.length}`)
    
    // Save to database
    const { saved, errors } = await saveStartupsToDatabase(supabase, uniqueStartups)
    
    const result = {
      success: true,
      message: `Scraping completed`,
      stats: {
        sources_processed: TECH_NEWS_SOURCES.length,
        startups_found: allStartups.length,
        unique_startups: uniqueStartups.length,
        saved_to_database: saved,
        errors: errors
      }
    }
    
    console.log('Scraping job completed:', result)
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scraping job failed:', error)
    return new Response(
      JSON.stringify({ error: 'Scraping failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
