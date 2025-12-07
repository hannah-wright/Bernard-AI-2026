/**
 * Deep Enrichment Script
 * Uses Zyte to scrape real data (founders, team size, competitors) 
 * then Gemini to structure and analyze it
 * 
 * Usage: 
 *   $env:GEMINI_API_KEY="key"; $env:SUPABASE_SERVICE_ROLE_KEY="key"; $env:ZYTE_API_KEY="key"; node scripts/deep-enrich.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkzscmfskerlanbsjugy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZYTE_API_KEY = process.env.ZYTE_API_KEY;

const BATCH_SIZE = 1; // One at a time for scraping
const DELAY_BETWEEN_ITEMS_MS = 3000; // 3 seconds between startups

// Zyte API for web scraping
async function scrapeWithZyte(url, extractArticle = false) {
  try {
    const response = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(ZYTE_API_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        url: url,
        browserHtml: true,
        ...(extractArticle && { article: true }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ⚠️ Zyte error for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.browserHtml || data.article?.body || null;
  } catch (error) {
    console.log(`   ⚠️ Scrape failed: ${error.message}`);
    return null;
  }
}

// Extract text content from HTML
function extractTextFromHtml(html) {
  if (!html) return '';
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Limit length
  return text.substring(0, 15000);
}

// Scrape company website for team/about info
async function scrapeCompanyWebsite(website) {
  if (!website) return null;
  
  const baseUrl = website.replace(/\/$/, '');
  const aboutUrls = [
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/team`,
    `${baseUrl}/company`,
    `${baseUrl}/about/team`,
  ];

  // Try the main page first
  let mainHtml = await scrapeWithZyte(baseUrl);
  let mainText = extractTextFromHtml(mainHtml);

  // Try about/team pages
  for (const url of aboutUrls) {
    const html = await scrapeWithZyte(url);
    if (html && html.length > 1000) {
      const text = extractTextFromHtml(html);
      if (text.toLowerCase().includes('founder') || 
          text.toLowerCase().includes('ceo') || 
          text.toLowerCase().includes('team')) {
        return { url, text: text.substring(0, 8000), mainText: mainText.substring(0, 5000) };
      }
    }
  }

  return { url: baseUrl, text: '', mainText: mainText.substring(0, 8000) };
}

// Scrape Crunchbase for company data
async function scrapeCrunchbase(companyName) {
  const searchName = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const crunchbaseUrl = `https://www.crunchbase.com/organization/${searchName}`;
  
  const html = await scrapeWithZyte(crunchbaseUrl);
  if (!html) return null;

  const text = extractTextFromHtml(html);
  
  // Check if we got a valid company page
  if (text.includes('Page not found') || text.length < 500) {
    return null;
  }

  return { url: crunchbaseUrl, text: text.substring(0, 10000) };
}

// Use Gemini to extract structured data from scraped content
async function extractDataWithGemini(startup, scrapedData) {
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
- If you cannot find specific founder names, leave the array empty - do NOT make up names like "Founder 1"
- If you cannot find team size, set to null
- If you cannot find revenue, set to null
- If you cannot find competitors, leave the array empty

Return ONLY valid JSON (no markdown):
{
  "founders": [
    {
      "name": "<real name found in content or leave empty array if not found>",
      "title": "<CEO/CTO/etc if found>",
      "linkedin": "<linkedin url if found, else null>",
      "prior_companies": ["<company names found>"],
      "education": ["<schools found>"]
    }
  ],
  "team_size": <number if found, else null>,
  "team_size_source": "<where you found this, e.g., 'Crunchbase' or 'company website'>",
  "estimated_revenue": "<revenue estimate if found, e.g., '$5M-10M ARR', else null>",
  "revenue_source": "<where you found this>",
  "competitors": ["<competitor 1>", "<competitor 2>", "<competitor 3>"],
  "competitors_source": "<where you found this>",
  "headquarters": "<city, country if found>",
  "founded_year": <year if found, else null>,
  "notable_customers": ["<customer names if found>"],
  "key_facts": ["<important fact 1>", "<important fact 2>"]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for factual extraction
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    throw new Error(`Gemini error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Extract JSON
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

// Supabase query helper
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

async function runDeepEnrichment() {
  console.log('🔬 Starting DEEP Enrichment (Zyte + Gemini)...\n');
  
  if (!GEMINI_API_KEY) {
    console.log('❌ Please set GEMINI_API_KEY environment variable!');
    process.exit(1);
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable!');
    process.exit(1);
  }

  if (!ZYTE_API_KEY) {
    console.log('❌ Please set ZYTE_API_KEY environment variable!');
    process.exit(1);
  }
  
  console.log(`📍 Supabase: ${SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
  console.log(`🤖 Gemini Key: ${GEMINI_API_KEY.substring(0, 10)}...`);
  console.log(`🕷️  Zyte Key: ${ZYTE_API_KEY.substring(0, 10)}...`);
  console.log(`\n📊 This scrapes real data from company websites & Crunchbase\n`);
  
  let totalEnriched = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  // Get startups that need deep enrichment (missing founder names or have "Founder 1")
  console.log('🔍 Finding startups with missing/placeholder data...\n');
  
  const startups = await supabaseQuery(
    `startups?select=id,name,website,description,founder_background,team_composition,competitive_landscape&enrichment_version=gte.3&order=created_at.desc&limit=50`
  );

  // Filter to those with missing data
  const startupsToEnrich = startups.filter(s => {
    const founders = s.founder_background?.founders || [];
    const hasPlaceholderFounder = founders.some(f => 
      f.name?.includes('Founder 1') || f.name?.includes('Founder 2') || !f.name
    );
    const missingTeamSize = !s.team_composition?.total_employees;
    const missingCompetitors = !s.competitive_landscape?.competitors?.length;
    
    return hasPlaceholderFounder || missingTeamSize || missingCompetitors;
  });

  console.log(`Found ${startupsToEnrich.length} startups needing deep enrichment\n`);

  for (const startup of startupsToEnrich) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏢 ${startup.name}`);
      console.log(`   Website: ${startup.website || 'N/A'}`);
      
      // Step 1: Scrape company website
      console.log(`   📄 Scraping company website...`);
      const websiteData = startup.website ? await scrapeCompanyWebsite(startup.website) : null;
      
      // Step 2: Scrape Crunchbase
      console.log(`   📊 Scraping Crunchbase...`);
      const crunchbaseData = await scrapeCrunchbase(startup.name);
      
      if (!websiteData?.text && !websiteData?.mainText && !crunchbaseData?.text) {
        console.log(`   ⚠️ No data scraped, skipping`);
        totalSkipped++;
        continue;
      }

      // Step 3: Extract data with Gemini
      console.log(`   🤖 Extracting structured data with Gemini...`);
      const extractedData = await extractDataWithGemini(startup, { websiteData, crunchbaseData });
      
      // Step 4: Update database
      const updateData = {};
      
      // Update founder_background if we found real names
      if (extractedData.founders?.length > 0 && extractedData.founders[0].name) {
        updateData.founder_background = {
          founders: extractedData.founders.map(f => ({
            name: f.name,
            education: f.education || [],
            prior_startups: [],
            notable_employers: f.prior_companies || [],
            years_in_industry: null,
          })),
          advisor_network: [],
        };
        console.log(`   ✓ Found founders: ${extractedData.founders.map(f => f.name).join(', ')}`);
      }

      // Update team_composition if we found team size
      if (extractedData.team_size) {
        const existingTeam = startup.team_composition || {};
        updateData.team_composition = {
          ...existingTeam,
          total_employees: extractedData.team_size,
        };
        console.log(`   ✓ Found team size: ${extractedData.team_size} employees`);
      }

      // Update competitive_landscape if we found competitors
      if (extractedData.competitors?.length > 0) {
        updateData.competitive_landscape = {
          competitors: extractedData.competitors,
          direct_competitors: extractedData.competitors.map(c => ({ name: c })),
          competitive_advantages: startup.competitive_landscape?.competitive_advantages || [],
        };
        console.log(`   ✓ Found competitors: ${extractedData.competitors.join(', ')}`);
      }

      // Update estimated_revenue if found
      if (extractedData.estimated_revenue) {
        updateData.estimated_revenue = extractedData.estimated_revenue;
        console.log(`   ✓ Found revenue: ${extractedData.estimated_revenue}`);
      }

      // Only update if we have new data
      if (Object.keys(updateData).length > 0) {
        updateData.enrichment_version = 4; // Mark as deep-enriched
        
        await fetch(`${SUPABASE_URL}/rest/v1/startups?id=eq.${startup.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        console.log(`   ✅ Updated successfully!`);
        totalEnriched++;
      } else {
        console.log(`   ⚠️ No new data found`);
        totalSkipped++;
      }
      
      // Delay between startups
      await sleep(DELAY_BETWEEN_ITEMS_MS);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      totalFailed++;
      
      if (error.message === 'RATE_LIMITED') {
        console.log('   ⏳ Rate limited! Waiting 60 seconds...');
        await sleep(60000);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEEP ENRICHMENT COMPLETE');
  console.log('='.repeat(50));
  console.log(`   ✅ Enriched: ${totalEnriched}`);
  console.log(`   ⚠️ Skipped: ${totalSkipped}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log('='.repeat(50));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runDeepEnrichment().catch(console.error);

