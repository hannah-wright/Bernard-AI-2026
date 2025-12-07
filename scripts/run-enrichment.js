/**
 * Direct Enrichment Script - Full VC Intelligence
 * Enriches startups with comprehensive data for Market, Team, and Predictive tabs
 * 
 * Usage: 
 *   $env:GEMINI_API_KEY="your-key"; $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/run-enrichment.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkzscmfskerlanbsjugy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const BATCH_SIZE = 5; // Paid tier can handle more
const DELAY_BETWEEN_ITEMS_MS = 2000; // 2 seconds between API calls

async function supabaseQuery(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
    },
    ...options,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${text}`);
  }
  
  return response.json();
}

async function enrichWithGemini(startup) {
  const sectorsArray = Array.isArray(startup.sectors) 
    ? startup.sectors 
    : typeof startup.sectors === 'string' && startup.sectors.startsWith('{')
      ? startup.sectors.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''))
      : [startup.sectors];

  const prompt = `You are an expert VC analyst with deep knowledge of startup ecosystems. Research and analyze this startup to provide comprehensive investment intelligence.

**Startup:** ${startup.name}
**Description:** ${startup.description || 'A technology startup'}
**Website:** ${startup.website || 'N/A'}
**Sectors:** ${sectorsArray.join(', ')}
**Location:** ${startup.city || 'Unknown'}, ${startup.country || 'Unknown'}
**Total Raised:** $${((startup.total_raised || 0) / 1000000).toFixed(1)}M

Based on your knowledge of this startup and similar companies in the ${sectorsArray[0] || 'technology'} space, provide a comprehensive JSON response. Make reasonable estimates based on typical patterns for startups at this stage and sector.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "unicorn_probability": <number 0-100>,
  "team_quality_score": <number 0-100>,
  "market_timing_score": <number 0-100>,
  "traction_score": <number 0-100>,
  "product_market_fit_score": <number 0-100>,
  "investment_readiness_score": <number 0-100>,
  "investor_fit_score": <number 0-100>,
  
  "competitive_advantage": "<2-3 sentences describing the startup's moat and differentiation>",
  "investment_thesis": "<2-3 sentence investment thesis>",
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "comparable_companies": ["<company 1>", "<company 2>", "<company 3>"],
  "predicted_next_round": "<e.g., Series A at $10M in 12-18 months>",
  "predicted_exit_timeline": "<e.g., 5-7 years, likely acquisition>",
  
  "market_context": {
    "tam_usd": <total addressable market in USD, e.g., 5000000000 for $5B>,
    "category_position": "<Leader|Challenger|Niche Player|Early Mover>",
    "market_growth_rate_pct": <annual market growth rate, e.g., 25>
  },
  
  "traction_metrics": {
    "mrr_usd": <estimated monthly recurring revenue or null>,
    "arr_usd": <estimated annual recurring revenue or null>,
    "mrr_growth_pct": <monthly growth rate or null>,
    "customer_count": <estimated number of customers or null>,
    "nrr_pct": <net revenue retention or null>,
    "dau": <daily active users or null>,
    "mau": <monthly active users or null>
  },
  
  "unit_economics": {
    "ltv_usd": <estimated customer lifetime value or null>,
    "cac_usd": <estimated customer acquisition cost or null>,
    "gross_margin_pct": <estimated gross margin or null>,
    "payback_months": <estimated CAC payback period or null>
  },
  
  "product_info": {
    "stage": "<MVP|Beta|GA|Growth|Scale>",
    "has_moat": <true|false>,
    "tech_differentiation": "<brief description of technical differentiation>"
  },
  
  "competitive_landscape": {
    "competitors": ["<competitor 1>", "<competitor 2>", "<competitor 3>"],
    "market_share_pct": <estimated market share or null>,
    "differentiation": "<key differentiator from competitors>"
  },
  
  "founder_background": {
    "founders": [
      {
        "name": "<founder name or 'Founder 1'>",
        "education": ["<school 1>"],
        "prior_startups": ["<startup if any>"],
        "notable_employers": ["<company 1>", "<company 2>"],
        "years_in_industry": <estimated years>
      }
    ],
    "advisor_network": ["<notable advisor or investor if known>"]
  },
  
  "team_composition": {
    "total_employees": <estimated total employees>,
    "engineering_count": <estimated engineering team size>,
    "sales_count": <estimated sales team size>,
    "ops_count": <estimated ops team size>,
    "product_count": <estimated product team size>,
    "has_cto": <true|false>,
    "has_vp_sales": <true|false>,
    "has_ciso": <true|false>
  },
  
  "social_proof": {
    "notable_customers": ["<customer 1 if known>"],
    "press_mentions": ["<publication if known>"],
    "awards": ["<award if known>"],
    "testimonials": []
  },
  
  "risk_flags": {
    "flags": ["<yellow flag 1>", "<yellow flag 2>"],
    "concerns": ["<concern 1>"],
    "red_flags": []
  },
  
  "funding_round": {
    "round_type": "<Pre-Seed|Seed|Series A|Series B|Bootstrapped>",
    "amount": <funding amount in USD, e.g., 5000000 for $5M>,
    "date": "<YYYY-MM-DD or best estimate>",
    "lead_investors": ["<lead investor if known>"]
  }
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096, // Increased for comprehensive response
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      console.log(`\n   ⚠️  Rate limit details: ${errorText.substring(0, 200)}`);
      throw new Error('RATE_LIMITED');
    }
    throw new Error(`Gemini error ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response text from Gemini');
  }

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
  }
  
  return JSON.parse(jsonStr);
}

async function runEnrichment() {
  console.log('🚀 Starting FULL VC Intelligence Enrichment...\n');
  
  if (!GEMINI_API_KEY) {
    console.log('❌ Please set GEMINI_API_KEY environment variable!');
    process.exit(1);
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable!');
    process.exit(1);
  }
  
  console.log(`📍 Supabase: ${SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
  console.log(`🤖 Gemini Key: ${GEMINI_API_KEY.substring(0, 10)}...`);
  console.log(`📊 This enrichment generates FULL data for Market, Team & Predictive tabs\n`);
  
  let totalEnriched = 0;
  let totalFailed = 0;
  let batchNumber = 0;
  
  while (true) {
    batchNumber++;
    console.log(`\n📦 Batch #${batchNumber} - Fetching pending startups...`);
    
    try {
      // Get pending queue items
      const queueItems = await supabaseQuery(
        `enrichment_queue?status=eq.pending&attempts=lt.3&order=created_at.asc&limit=${BATCH_SIZE}`
      );
      
      if (!queueItems || queueItems.length === 0) {
        console.log('\n✅ No more pending items. Enrichment complete!');
        break;
      }
      
      console.log(`   Found ${queueItems.length} startups to enrich`);
      
      // Get startup details (including more fields for context)
      const startupIds = queueItems.map(q => q.startup_id);
      const startups = await supabaseQuery(
        `startups?id=in.(${startupIds.join(',')})&select=id,name,description,website,sectors,total_raised,city,country`
      );
      
      for (const startup of startups) {
        const queueItem = queueItems.find(q => q.startup_id === startup.id);
        
        try {
          process.stdout.write(`   🔄 ${startup.name}... `);
          
          // Mark as processing
          await fetch(`${SUPABASE_URL}/rest/v1/enrichment_queue?id=eq.${queueItem.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'processing' }),
          });
          
          const enrichment = await enrichWithGemini(startup);
          
          // Update startup with comprehensive data
          const updateData = {
            // Scores
            unicorn_probability: enrichment.unicorn_probability,
            team_quality_score: enrichment.team_quality_score,
            market_timing_score: enrichment.market_timing_score,
            traction_score: enrichment.traction_score,
            product_market_fit_score: enrichment.product_market_fit_score,
            investment_readiness_score: enrichment.investment_readiness_score,
            investor_fit_score: enrichment.investor_fit_score,
            
            // Text fields
            competitive_advantage: enrichment.competitive_advantage,
            investment_thesis: enrichment.investment_thesis,
            key_risks: enrichment.key_risks,
            comparable_companies: enrichment.comparable_companies,
            predicted_next_round: enrichment.predicted_next_round,
            predicted_exit_timeline: enrichment.predicted_exit_timeline,
            
            // JSON fields for tabs
            market_context: enrichment.market_context,
            traction_metrics: enrichment.traction_metrics,
            unit_economics: enrichment.unit_economics,
            product_info: enrichment.product_info,
            competitive_landscape: enrichment.competitive_landscape,
            founder_background: enrichment.founder_background,
            team_composition: enrichment.team_composition,
            social_proof: enrichment.social_proof,
            risk_flags: enrichment.risk_flags,
            
            // Metadata
            last_enriched_at: new Date().toISOString(),
            enrichment_version: 3, // Version 3 = full enrichment
          };
          
          await fetch(`${SUPABASE_URL}/rest/v1/startups?id=eq.${startup.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
          
          // Add funding round if we have data and startup doesn't have one
          if (enrichment.funding_round && enrichment.funding_round.amount) {
            // Check if funding round exists
            const existingRounds = await supabaseQuery(
              `funding_rounds?startup_id=eq.${startup.id}&limit=1`
            );
            
            if (!existingRounds || existingRounds.length === 0) {
              await fetch(`${SUPABASE_URL}/rest/v1/funding_rounds`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  startup_id: startup.id,
                  amount: enrichment.funding_round.amount,
                  round_type: enrichment.funding_round.round_type || 'Seed',
                  date: enrichment.funding_round.date || new Date().toISOString().split('T')[0],
                  lead_investors: enrichment.funding_round.lead_investors || [],
                }),
              });
            }
          }
          
          // Mark queue as completed
          await fetch(`${SUPABASE_URL}/rest/v1/enrichment_queue?id=eq.${queueItem.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'completed' }),
          });
          
          console.log('✅');
          totalEnriched++;
          
          // Delay between API calls
          await sleep(DELAY_BETWEEN_ITEMS_MS);
          
        } catch (error) {
          console.log(`❌ ${error.message}`);
          totalFailed++;
          
          // Update queue with error
          const newAttempts = (queueItem.attempts || 0) + 1;
          await fetch(`${SUPABASE_URL}/rest/v1/enrichment_queue?id=eq.${queueItem.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              status: newAttempts >= 3 ? 'failed' : 'pending',
              attempts: newAttempts,
              error_message: error.message,
            }),
          });
          
          if (error.message === 'RATE_LIMITED') {
            console.log('   ⏳ Rate limited! Waiting 60 seconds...');
            await sleep(60000);
          }
        }
      }
      
      // Get remaining count
      const remaining = await supabaseQuery(
        'enrichment_queue?status=eq.pending&select=id',
        { prefer: 'count=exact' }
      );
      console.log(`\n   📊 Remaining in queue: ~${remaining.length || '?'}`);
      
    } catch (error) {
      console.error(`\n❌ Batch error: ${error.message}`);
      console.log('⏳ Waiting 10 seconds before retry...');
      await sleep(10000);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FULL ENRICHMENT COMPLETE');
  console.log('='.repeat(50));
  console.log(`   Total Enriched: ${totalEnriched}`);
  console.log(`   Total Failed: ${totalFailed}`);
  console.log(`   Total Batches: ${batchNumber}`);
  console.log('='.repeat(50));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runEnrichment().catch(console.error);
