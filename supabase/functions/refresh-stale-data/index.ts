import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get parameters from request
    const body = await req.json().catch(() => ({}))
    const staleDays = body.staleDays ?? 7 // Default: refresh data older than 7 days
    const maxToQueue = body.maxToQueue ?? 20 // Default: queue max 20 at a time

    console.log(`=== Refreshing stale data (>${staleDays} days old) ===`)

    // Find startups that need refresh
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - staleDays)

    const { data: staleStartups, error: staleError } = await supabase
      .from('startups')
      .select('id, name, last_enriched_at')
      .or(`last_enriched_at.is.null,last_enriched_at.lt.${staleDate.toISOString()}`)
      .order('last_enriched_at', { ascending: true, nullsFirst: true })
      .limit(maxToQueue)

    if (staleError) {
      throw new Error(`Failed to fetch stale startups: ${staleError.message}`)
    }

    if (!staleStartups || staleStartups.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No stale startups found',
          staleDays,
          queued: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${staleStartups.length} stale startups`)

    // Queue them for re-enrichment
    let queued = 0
    let skipped = 0

    for (const startup of staleStartups) {
      // Check if already in queue
      const { data: existing } = await supabase
        .from('enrichment_queue')
        .select('id')
        .eq('startup_id', startup.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        console.log(`Skipping ${startup.name} - already in queue`)
        skipped++
        continue
      }

      const { error: insertError } = await supabase
        .from('enrichment_queue')
        .insert({
          startup_id: startup.id,
          priority: 1, // Low priority for refresh
          status: 'pending'
        })

      if (insertError) {
        console.error(`Failed to queue ${startup.name}:`, insertError)
        skipped++
      } else {
        console.log(`✓ Queued for refresh: ${startup.name}`)
        queued++
      }
    }

    // Get current queue stats
    const { count: pendingCount } = await supabase
      .from('enrichment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return new Response(
      JSON.stringify({
        success: true,
        staleDays,
        found: staleStartups.length,
        queued,
        skipped,
        totalPendingInQueue: pendingCount || 0,
        message: `Queued ${queued} stale startups for re-enrichment`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Refresh error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

