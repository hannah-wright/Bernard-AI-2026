import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentResult {
  unicorn_probability: number
  team_quality_score: number
  market_timing_score: number
  traction_score: number
  competitive_advantage: string
  key_risks: string[]
  investment_thesis: string
  comparable_companies: string[]
  predicted_next_round: string
  predicted_exit_timeline: string
  investor_fit_score: number
}

async function enrichWithGemini(startup: { name: string; description: string; sectors: string[]; total_raised: number }, apiKey: string): Promise<EnrichmentResult | null> {
  const sectorsArray = Array.isArray(startup.sectors) 
    ? startup.sectors 
    : typeof startup.sectors === 'string' && startup.sectors.startsWith('{')
      ? startup.sectors.slice(1, -1).split(',').map((s: string) => s.trim())
      : [startup.sectors]

  const prompt = `You are a VC analyst. Analyze this startup and provide investment intelligence:

**Startup:** ${startup.name}
**Description:** ${startup.description}
**Sectors:** ${sectorsArray.join(', ')}
**Total Raised:** $${(startup.total_raised / 1000000).toFixed(1)}M

Provide a JSON response with these fields (no markdown, just JSON):
{
  "unicorn_probability": <number 0-100>,
  "team_quality_score": <number 0-100>,
  "market_timing_score": <number 0-100>,
  "traction_score": <number 0-100>,
  "competitive_advantage": "<string describing moat>",
  "key_risks": ["<risk1>", "<risk2>", "<risk3>"],
  "investment_thesis": "<2-3 sentence thesis>",
  "comparable_companies": ["<comp1>", "<comp2>", "<comp3>"],
  "predicted_next_round": "<e.g., Series B at $50M>",
  "predicted_exit_timeline": "<e.g., 5-7 years>",
  "investor_fit_score": <number 0-100>
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Gemini API error for ${startup.name}: ${response.status} - ${errorText}`)
    
    // Handle rate limit
    if (response.status === 429) {
      throw new Error('RATE_LIMITED')
    }
    return null
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    console.error(`No text in Gemini response for ${startup.name}`)
    return null
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`No JSON found in response for ${startup.name}`)
      return null
    }
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error(`JSON parse error for ${startup.name}:`, e)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get batch size from request (default 5)
    const body = await req.json().catch(() => ({}))
    const batchSize = Math.min(body.batchSize ?? 5, 10) // Max 10 at a time

    // Get pending items from queue (highest priority first)
    const { data: queueItems, error: queueError } = await supabase
      .from('enrichment_queue')
      .select('id, startup_id, attempts')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (queueError) {
      throw new Error(`Queue fetch error: ${queueError.message}`)
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending items in queue', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${queueItems.length} items from enrichment queue`)

    // Mark items as processing
    const queueIds = queueItems.map(q => q.id)
    await supabase
      .from('enrichment_queue')
      .update({ status: 'processing' })
      .in('id', queueIds)

    // Get startup data
    const startupIds = queueItems.map(q => q.startup_id)
    const { data: startups, error: startupError } = await supabase
      .from('startups')
      .select('id, name, description, sectors, total_raised')
      .in('id', startupIds)

    if (startupError || !startups) {
      throw new Error(`Startup fetch error: ${startupError?.message}`)
    }

    let enriched = 0
    let failed = 0
    const results: { name: string; status: string }[] = []

    // Process each startup
    for (const startup of startups) {
      const queueItem = queueItems.find(q => q.startup_id === startup.id)!
      
      try {
        console.log(`Enriching: ${startup.name}`)
        
        const enrichment = await enrichWithGemini(startup, geminiApiKey)
        
        if (enrichment) {
          // Update startup with enrichment data
          const { error: updateError } = await supabase
            .from('startups')
            .update({
              unicorn_probability: enrichment.unicorn_probability,
              team_quality_score: enrichment.team_quality_score,
              market_timing_score: enrichment.market_timing_score,
              traction_score: enrichment.traction_score,
              competitive_advantage: enrichment.competitive_advantage,
              key_risks: enrichment.key_risks,
              investment_thesis: enrichment.investment_thesis,
              comparable_companies: enrichment.comparable_companies,
              predicted_next_round: enrichment.predicted_next_round,
              predicted_exit_timeline: enrichment.predicted_exit_timeline,
              investor_fit_score: enrichment.investor_fit_score,
              last_enriched_at: new Date().toISOString(),
              enrichment_version: 2
            })
            .eq('id', startup.id)

          if (updateError) {
            throw new Error(updateError.message)
          }

          // Mark queue item as completed
          await supabase
            .from('enrichment_queue')
            .update({ status: 'completed', processed_at: new Date().toISOString() })
            .eq('id', queueItem.id)

          enriched++
          results.push({ name: startup.name, status: 'enriched' })
          console.log(`✓ Enriched: ${startup.name}`)
        } else {
          throw new Error('No enrichment data returned')
        }
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`✗ Failed: ${startup.name} - ${errorMessage}`)
        
        // Handle rate limiting specially
        if (errorMessage === 'RATE_LIMITED') {
          // Put back in queue for later
          await supabase
            .from('enrichment_queue')
            .update({ 
              status: 'pending', 
              attempts: queueItem.attempts + 1,
              error_message: 'Rate limited - will retry'
            })
            .eq('id', queueItem.id)
          
          results.push({ name: startup.name, status: 'rate_limited' })
        } else {
          // Mark as failed if max attempts reached
          const newAttempts = queueItem.attempts + 1
          await supabase
            .from('enrichment_queue')
            .update({ 
              status: newAttempts >= 3 ? 'failed' : 'pending',
              attempts: newAttempts,
              error_message: errorMessage
            })
            .eq('id', queueItem.id)
          
          results.push({ name: startup.name, status: newAttempts >= 3 ? 'failed' : 'retry' })
        }
        
        failed++
      }
    }

    // Check if there are more items in queue
    const { count } = await supabase
      .from('enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return new Response(
      JSON.stringify({
        success: true,
        processed: queueItems.length,
        enriched,
        failed,
        results,
        remainingInQueue: count || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Queue processing error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

