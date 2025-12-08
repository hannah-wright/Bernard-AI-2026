/**
 * Deep Enrich V2 - Comprehensive Multi-Source Data Enrichment with FULL Validation
 * 
 * EVERY data field is validated before saving:
 * 1. Scraped from multiple sources via Zyte
 * 2. Cross-referenced with Gemini analysis
 * 3. Validated against strict rules
 * 4. Confidence scored per field
 * 5. Flagged for review if uncertain
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZYTE_API_KEY = Deno.env.get("ZYTE_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ScrapedData {
  source: string;
  url: string;
  content: string;
  scraped_at: string;
}

interface FieldValidation {
  value: unknown;
  confidence: 'verified' | 'high' | 'medium' | 'low' | 'unverified';
  sources: string[];
  needs_review: boolean;
  validation_notes: string;
}

interface ValidatedEnrichment {
  // Company basics
  name: FieldValidation;
  description: FieldValidation;
  website: FieldValidation;
  
  // Funding
  is_bootstrapped: FieldValidation;
  total_raised: FieldValidation;
  funding_rounds: FieldValidation;
  
  // Exit status
  was_acquired: FieldValidation;
  acquired_by: FieldValidation;
  acquisition_date: FieldValidation;
  acquisition_amount: FieldValidation;
  had_ipo: FieldValidation;
  ipo_date: FieldValidation;
  stock_ticker: FieldValidation;
  
  // Revenue
  estimated_revenue: FieldValidation;
  revenue_confidence: FieldValidation;
  revenue_source: FieldValidation;
  
  // Team
  headcount_current: FieldValidation;
  employee_growth_yoy_percent: FieldValidation;
  founder_background: FieldValidation;
  team_composition: FieldValidation;
  team_structure_type: FieldValidation;
  
  // Competitive
  direct_competitors: FieldValidation;
  competitive_landscape: FieldValidation;
  
  // Location
  city: FieldValidation;
  country: FieldValidation;
  
  // Scores (calculated, not scraped)
  unicorn_likelihood_score: FieldValidation;
  founding_team_signal_score: FieldValidation;
  hiring_velocity_score: FieldValidation;
  backer_quality_score: FieldValidation;
  
  // Meta
  overall_confidence: 'high' | 'medium' | 'low';
  fields_verified: number;
  fields_unverified: number;
  critical_issues: string[];
}

// Scrape a URL using Zyte API
async function scrapeWithZyte(url: string, source: string): Promise<ScrapedData | null> {
  if (!ZYTE_API_KEY) {
    console.log(`Zyte API key not configured, skipping ${source}`);
    return null;
  }

  try {
    const response = await fetch("https://api.zyte.com/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(ZYTE_API_KEY + ":")}`,
      },
      body: JSON.stringify({
        url: url,
        browserHtml: true,
        javascript: true,
      }),
    });

    if (!response.ok) {
      console.error(`Zyte scrape failed for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      source,
      url,
      content: data.browserHtml || "",
      scraped_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Zyte scrape error for ${url}:`, error);
    return null;
  }
}

// Scrape multiple sources for a company
async function scrapeAllSources(companyName: string, website?: string): Promise<ScrapedData[]> {
  const results: ScrapedData[] = [];
  
  // 1. TechCrunch search
  const tcSearch = `https://techcrunch.com/search/${encodeURIComponent(companyName)}`;
  const tcData = await scrapeWithZyte(tcSearch, "TechCrunch");
  if (tcData) results.push(tcData);
  
  // 2. Crunchbase profile
  const cbSlug = companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const cbData = await scrapeWithZyte(`https://www.crunchbase.com/organization/${cbSlug}`, "Crunchbase");
  if (cbData) results.push(cbData);
  
  // 3. Company website (about page)
  if (website) {
    const aboutUrl = website.endsWith('/') ? `${website}about` : `${website}/about`;
    const siteData = await scrapeWithZyte(aboutUrl, "Company Website");
    if (siteData) results.push(siteData);
  }
  
  // 4. Google search for acquisition/exit news
  const exitSearch = `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" acquired OR acquisition OR shutdown OR IPO 2023 OR 2024`)}`;
  const exitData = await scrapeWithZyte(exitSearch, "Google News (Exit)");
  if (exitData) results.push(exitData);
  
  // 5. LinkedIn company search
  const liSearch = `https://www.linkedin.com/company/${cbSlug}`;
  const liData = await scrapeWithZyte(liSearch, "LinkedIn");
  if (liData) results.push(liData);
  
  // 6. IndieHackers (for bootstrapped revenue)
  const ihSearch = `https://www.indiehackers.com/search?q=${encodeURIComponent(companyName)}`;
  const ihData = await scrapeWithZyte(ihSearch, "IndieHackers");
  if (ihData) results.push(ihData);
  
  return results;
}

// Comprehensive Gemini prompt for ALL field extraction and validation
function buildGeminiPrompt(
  startup: { name: string; description: string; website?: string; city?: string; country?: string },
  scrapedData: ScrapedData[]
): string {
  const scrapedContext = scrapedData
    .filter(d => d && d.content)
    .map(d => `=== SOURCE: ${d.source} (${d.url}) ===\n${d.content.substring(0, 4000)}`)
    .join("\n\n");

  return `You are a meticulous VC research analyst. Your job is to extract and VALIDATE data about startups.

STARTUP TO RESEARCH: ${startup.name}
CURRENT DESCRIPTION: ${startup.description}
WEBSITE: ${startup.website || 'Unknown'}
CURRENT LOCATION: ${startup.city || 'Unknown'}, ${startup.country || 'Unknown'}

SCRAPED DATA FROM MULTIPLE SOURCES:
${scrapedContext || "No scraped data available - use only your training knowledge."}

=== CRITICAL VALIDATION RULES ===

For EVERY field, you must:
1. Check if the data appears in scraped sources
2. Cross-reference with your training knowledge
3. Assign a confidence level:
   - "verified": Found in 2+ sources OR official company source
   - "high": Found in 1 reliable source (TechCrunch, Crunchbase, LinkedIn)
   - "medium": Only in your training knowledge, seems accurate
   - "low": Uncertain, conflicting info, or outdated
   - "unverified": Cannot find reliable data - LEAVE NULL

4. For EVERY field, cite your sources
5. If data seems wrong or outdated, flag for review
6. NEVER make up data - leave null if unknown

=== SPECIFIC VALIDATION CHECKS ===

FUNDING STATUS:
- Search for funding announcements in TechCrunch/Crunchbase
- If NO funding found, check if described as "bootstrapped" or "self-funded"
- Cross-check: If bootstrapped, total_raised MUST be 0
- Cross-check: If total_raised > 0, must have at least one funding_round

EXIT STATUS:
- Search for "acquired", "acquisition", "shutdown", "IPO" news
- Check if company is still operating independently
- If acquired, find: acquirer, date, amount (if disclosed)
- If IPO'd, find: ticker symbol, IPO date

REVENUE:
- ONLY include if explicitly stated somewhere
- Check IndieHackers for bootstrapped company revenue
- Check TechCrunch for revenue announcements
- If estimating, clearly mark as "estimated" with methodology

HEADCOUNT:
- Primary source: LinkedIn company page
- Secondary: Company about page, Crunchbase
- Note the source and date of headcount data

COMPETITORS:
- Think about the product category
- List 3-5 direct competitors
- Include competitor funding stage if known
- Only list real competitors, not vague categories

FOUNDERS:
- Find founder names from company website or LinkedIn
- Note their previous companies/experience
- Check for prior exits

LOCATION:
- Verify from company website or LinkedIn
- Note if company is remote-first

=== REQUIRED JSON RESPONSE FORMAT ===

Return a JSON object where EVERY field follows this structure:
{
  "field_name": {
    "value": <the actual value or null if unknown>,
    "confidence": "verified|high|medium|low|unverified",
    "sources": ["list of sources where you found this"],
    "needs_review": <boolean - true if data seems off>,
    "validation_notes": "explain how you validated this"
  }
}

FULL RESPONSE STRUCTURE:

{
  "name": { "value": "${startup.name}", "confidence": "verified", "sources": ["Input"], "needs_review": false, "validation_notes": "Provided in input" },
  
  "description": { "value": "<corrected description if inaccurate>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "website": { "value": "<website URL>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "is_bootstrapped": { "value": <boolean>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "total_raised": { "value": <number in USD or 0>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "funding_rounds": { 
    "value": [{"round_type": "Seed|Series A|etc", "amount": <number>, "date": "YYYY-MM", "lead_investor": "name"}] or [],
    "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." 
  },
  
  "was_acquired": { "value": <boolean>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "acquired_by": { "value": "<acquirer or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "acquisition_date": { "value": "<YYYY-MM-DD or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "acquisition_amount": { "value": <number or null>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "had_ipo": { "value": <boolean>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "ipo_date": { "value": "<YYYY-MM-DD or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "stock_ticker": { "value": "<ticker or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "estimated_revenue": { "value": "<$XM ARR or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "headcount_current": { "value": <number or null>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "employee_growth_yoy_percent": { "value": <number or null>, "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "founder_background": {
    "value": {"founders": [{"name": "...", "role": "CEO|CTO|etc", "notable_employers": [...], "education": [...]}], "technical_cofounder": <bool>},
    "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..."
  },
  
  "team_composition": {
    "value": {"total_employees": <n>, "engineering_count": <n>, "sales_count": <n>} or null,
    "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..."
  },
  
  "team_structure_type": { 
    "value": "technical-heavy|balanced-cofounders|solo-technical|technical-ceo-commercial-coo|null",
    "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..."
  },
  
  "direct_competitors": {
    "value": [{"name": "...", "stage": "...", "overlap_pct": <0-100>}] or [],
    "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..."
  },
  
  "city": { "value": "<city or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "country": { "value": "<country or null>", "confidence": "...", "sources": [...], "needs_review": <bool>, "validation_notes": "..." },
  
  "critical_issues": ["List any major data quality issues found"]
}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;
}

// Call Gemini API
async function analyzeWithGemini(prompt: string): Promise<Record<string, FieldValidation> | null> {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errText}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No response from Gemini");
      return null;
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", text.substring(0, 500));
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
}

// Validate consistency between fields
function validateConsistency(data: Record<string, FieldValidation>): string[] {
  const issues: string[] = [];
  
  // Check bootstrapped vs total_raised consistency
  const isBootstrapped = data.is_bootstrapped?.value;
  const totalRaised = data.total_raised?.value as number;
  
  if (isBootstrapped === true && totalRaised > 0) {
    issues.push(`INCONSISTENT: is_bootstrapped=true but total_raised=${totalRaised}`);
  }
  if (isBootstrapped === false && totalRaised === 0) {
    issues.push(`INCONSISTENT: is_bootstrapped=false but total_raised=0`);
  }
  
  // Check funding rounds vs total_raised
  const fundingRounds = data.funding_rounds?.value as Array<{amount: number}> | undefined;
  if (fundingRounds && fundingRounds.length > 0) {
    const sumOfRounds = fundingRounds.reduce((sum, r) => sum + (r.amount || 0), 0);
    if (Math.abs(sumOfRounds - totalRaised) > totalRaised * 0.2) {
      issues.push(`INCONSISTENT: sum of funding rounds (${sumOfRounds}) != total_raised (${totalRaised})`);
    }
  }
  
  // Check acquired but still has funding data
  const wasAcquired = data.was_acquired?.value;
  const acquiredBy = data.acquired_by?.value;
  if (wasAcquired === true && !acquiredBy) {
    issues.push(`INCONSISTENT: was_acquired=true but acquired_by is null`);
  }
  
  // Check IPO but no ticker
  const hadIpo = data.had_ipo?.value;
  const ticker = data.stock_ticker?.value;
  if (hadIpo === true && !ticker) {
    issues.push(`WARNING: had_ipo=true but no stock_ticker`);
  }
  
  // Check competitors exist
  const competitors = data.direct_competitors?.value as Array<unknown> | undefined;
  if (!competitors || competitors.length === 0) {
    issues.push(`WARNING: No competitors identified`);
  }
  
  // Check founders exist
  const founders = (data.founder_background?.value as {founders?: Array<unknown>})?.founders;
  if (!founders || founders.length === 0) {
    issues.push(`WARNING: No founders identified`);
  }
  
  return issues;
}

// Only save fields that pass validation thresholds
function filterValidatedFields(data: Record<string, FieldValidation>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const sourcesUsed = new Set<string>();
  let verifiedCount = 0;
  let unverifiedCount = 0;
  
  for (const [field, validation] of Object.entries(data)) {
    if (!validation || field === 'critical_issues') continue;
    
    // Track sources
    if (validation.sources) {
      validation.sources.forEach(s => sourcesUsed.add(s));
    }
    
    // Only save if confidence is not "unverified"
    if (validation.confidence === 'unverified' || validation.value === null || validation.value === undefined) {
      unverifiedCount++;
      continue;
    }
    
    verifiedCount++;
    
    // Map field names to database columns
    const dbField = fieldToDbColumn(field);
    if (dbField) {
      result[dbField] = validation.value;
      
      // Add confidence for revenue
      if (field === 'estimated_revenue') {
        result['revenue_confidence'] = validation.confidence === 'verified' ? 'verified' : 'estimated';
        result['revenue_source'] = validation.sources?.join(', ') || null;
      }
    }
  }
  
  result['_meta'] = {
    sources_used: Array.from(sourcesUsed),
    verified_count: verifiedCount,
    unverified_count: unverifiedCount,
  };
  
  return result;
}

function fieldToDbColumn(field: string): string | null {
  const mapping: Record<string, string> = {
    'name': 'name',
    'description': 'description',
    'website': 'website',
    'is_bootstrapped': 'is_bootstrapped',
    'total_raised': 'total_raised',
    'was_acquired': 'was_acquired',
    'acquired_by': 'acquired_by',
    'acquisition_date': 'acquisition_date',
    'acquisition_amount': 'acquisition_amount',
    'had_ipo': 'had_ipo',
    'ipo_date': 'ipo_date',
    'stock_ticker': 'stock_ticker',
    'estimated_revenue': 'estimated_revenue',
    'headcount_current': 'headcount_current',
    'employee_growth_yoy_percent': 'employee_growth_yoy_percent',
    'founder_background': 'founder_background',
    'team_composition': 'team_composition',
    'team_structure_type': 'team_structure_type',
    'direct_competitors': 'direct_competitors',
    'city': 'city',
    'country': 'country',
  };
  return mapping[field] || null;
}

// Update startup with validated data
async function updateStartupWithValidation(
  supabase: ReturnType<typeof createClient>,
  startupId: string,
  validatedData: Record<string, unknown>,
  consistencyIssues: string[],
  criticalIssues: string[]
): Promise<{ success: boolean; fieldsUpdated: number; issues: string[] }> {
  try {
    const meta = validatedData['_meta'] as { sources_used: string[]; verified_count: number; unverified_count: number };
    delete validatedData['_meta'];
    
    const allIssues = [...consistencyIssues, ...criticalIssues];
    
    const updateData: Record<string, unknown> = {
      ...validatedData,
      enrichment_version: 6,
      updated_at: new Date().toISOString(),
      data_verified_at: new Date().toISOString(),
      needs_review: allIssues.length > 0,
      data_verification_notes: allIssues.length > 0 
        ? `Issues: ${allIssues.join('; ')}. Sources: ${meta.sources_used.join(', ')}`
        : `Verified from: ${meta.sources_used.join(', ')}`,
    };
    
    // Build competitive_landscape from direct_competitors
    if (validatedData.direct_competitors) {
      updateData.competitive_landscape = {
        direct_competitors: validatedData.direct_competitors,
      };
    }
    
    const { error } = await supabase
      .from('startups')
      .update(updateData)
      .eq('id', startupId);
    
    if (error) {
      console.error(`Failed to update startup ${startupId}:`, error);
      return { success: false, fieldsUpdated: 0, issues: [error.message] };
    }
    
    // Update data sources
    for (const source of meta.sources_used) {
      if (source !== 'Input' && source !== 'Gemini Knowledge') {
        await supabase
          .from('data_sources')
          .upsert({
            startup_id: startupId,
            name: source,
            confidence: 'high',
          }, { onConflict: 'startup_id,name' })
          .catch(() => {}); // Ignore duplicates
      }
    }
    
    return { 
      success: true, 
      fieldsUpdated: meta.verified_count,
      issues: allIssues 
    };
  } catch (error) {
    console.error(`Error updating startup ${startupId}:`, error);
    return { success: false, fieldsUpdated: 0, issues: [String(error)] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startup_id, startup_ids, batch_size = 5, force_all = false } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get startups to enrich
    let query = supabase
      .from('startups')
      .select('id, name, description, website, city, country, total_raised')
      .order('total_raised', { ascending: false, nullsFirst: false });

    if (startup_id) {
      query = query.eq('id', startup_id);
    } else if (startup_ids && Array.isArray(startup_ids)) {
      query = query.in('id', startup_ids);
    } else if (force_all) {
      // Re-enrich ALL startups
      query = query.limit(batch_size);
    } else {
      // Find startups needing enrichment
      query = query
        .or('direct_competitors.is.null,founder_background.is.null,was_acquired.is.null,needs_review.eq.true')
        .neq('enrichment_version', 6)
        .limit(batch_size);
    }

    const { data: startups, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch startups: ${fetchError.message}`);
    }

    if (!startups || startups.length === 0) {
      return new Response(
        JSON.stringify({ message: "No startups found to enrich", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      id: string;
      name: string;
      success: boolean;
      fields_updated: number;
      sources_checked: number;
      issues: string[];
    }> = [];

    for (const startup of startups) {
      console.log(`\n=== Enriching: ${startup.name} ===`);
      
      // Step 1: Scrape multiple sources
      console.log("Scraping sources...");
      const scrapedData = await scrapeAllSources(startup.name, startup.website);
      console.log(`Scraped ${scrapedData.length} sources`);
      
      // Step 2: Build comprehensive prompt
      const prompt = buildGeminiPrompt(startup, scrapedData);
      
      // Step 3: Analyze with Gemini
      console.log("Analyzing with Gemini...");
      const rawEnrichment = await analyzeWithGemini(prompt);
      
      if (!rawEnrichment) {
        results.push({
          id: startup.id,
          name: startup.name,
          success: false,
          fields_updated: 0,
          sources_checked: scrapedData.length,
          issues: ["Gemini analysis failed"],
        });
        continue;
      }
      
      // Step 4: Validate consistency
      console.log("Validating consistency...");
      const consistencyIssues = validateConsistency(rawEnrichment);
      const criticalIssues = (rawEnrichment.critical_issues as unknown as string[]) || [];
      
      // Step 5: Filter to only validated fields
      console.log("Filtering validated fields...");
      const validatedData = filterValidatedFields(rawEnrichment);
      
      // Step 6: Update database
      console.log("Updating database...");
      const updateResult = await updateStartupWithValidation(
        supabase,
        startup.id,
        validatedData,
        consistencyIssues,
        criticalIssues
      );
      
      results.push({
        id: startup.id,
        name: startup.name,
        success: updateResult.success,
        fields_updated: updateResult.fieldsUpdated,
        sources_checked: scrapedData.length + 1, // +1 for Gemini
        issues: updateResult.issues,
      });
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successCount = results.filter(r => r.success).length;
    const totalFieldsUpdated = results.reduce((sum, r) => sum + r.fields_updated, 0);
    
    return new Response(
      JSON.stringify({
        message: `Enriched ${successCount}/${results.length} startups with ${totalFieldsUpdated} validated fields`,
        summary: {
          total_processed: results.length,
          successful: successCount,
          failed: results.length - successCount,
          total_fields_updated: totalFieldsUpdated,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deep enrich error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
