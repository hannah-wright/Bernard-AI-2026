# BernardAI Data Enrichment Rules

## ⚠️ CRITICAL: ALL DATA MUST BE VALIDATED

**Every single data field requires validation before saving.**

Current Status (as of latest audit):
- 545 startups flagged for re-enrichment
- Only 1 properly validated (Magnific - manual)
- 520+ missing competitors
- 519+ missing founder data

## Core Principle: Accuracy Over Completeness

**It is better to have accurate data for 5 fields than inaccurate data for 20 fields.**

## Validation Requirements Per Field

Every field saved must have:
1. **Value** - The actual data
2. **Confidence** - verified/high/medium/low/unverified
3. **Sources** - List of sources where data was found
4. **Needs Review** - Boolean flag for uncertain data
5. **Validation Notes** - How the data was validated

### Confidence Levels:
- `verified` - Found in 2+ sources OR official company source
- `high` - Found in 1 reliable source (TechCrunch, Crunchbase, LinkedIn)
- `medium` - Only in Gemini training knowledge, seems accurate
- `low` - Uncertain, conflicting info, or outdated
- `unverified` - Cannot find reliable data → **DO NOT SAVE**

## Data Source Priority

### Tier 1: Primary Sources (Highest Trust)
1. **Company Website** - Official about page, press releases
2. **SEC Filings** - For public companies, IPOs
3. **Crunchbase** - Funding rounds, acquisitions (verified entries)
4. **Official Press Releases** - Revenue announcements, acquisitions

### Tier 2: News Sources (High Trust)
1. **TechCrunch** - Funding announcements, exits
2. **Forbes** - Revenue figures, valuations
3. **Bloomberg** - Financial data
4. **WSJ** - Business news

### Tier 3: Professional Data (Medium Trust)
1. **LinkedIn** - Headcount, employee growth
2. **PitchBook** - Funding data
3. **CB Insights** - Market data

### Tier 4: AI Analysis (Requires Validation)
1. **Gemini** - Knowledge base, analysis
2. Only use for cross-referencing, not primary source

## Critical Data Fields

### 1. Funding Status
- **is_bootstrapped**: Check FIRST. Many viral products never raised funding.
- **total_raised**: Sum of ALL verified rounds. 0 if bootstrapped.
- **funding_rounds**: List each round with date, amount, lead investor, SOURCE.

**Common Mistakes to Avoid:**
- ❌ Assuming all startups raised funding
- ❌ Using placeholder values ($500K, $1M) when unknown
- ❌ Not marking bootstrapped companies correctly

**Verification Steps:**
1. Search Crunchbase for funding history
2. Search TechCrunch "[company] funding"
3. Check company press page
4. If no funding found after 3 sources, mark as bootstrapped

### 2. Acquisition/Exit Status
- **was_acquired**: TRUE if company was acquired
- **acquired_by**: Acquirer name
- **acquisition_date**: When acquired
- **acquisition_amount**: Price if disclosed

**Common Mistakes to Avoid:**
- ❌ Missing recent acquisitions (check 2023-2024 news)
- ❌ Not updating company status post-acquisition

**Verification Steps:**
1. Search "[company] acquired" on Google News
2. Check TechCrunch for acquisition news
3. Check acquirer's press releases
4. Look for shutdown announcements

### 3. Competitors
- **direct_competitors**: 3-5 companies in the same category
- Include: name, funding stage, overlap percentage

**Verification Steps:**
1. Think about the product category
2. Search "[company] competitors" or "[company] alternatives"
3. Check G2, Capterra for software comparisons
4. Include both funded and bootstrapped competitors

### 4. Revenue
- **estimated_revenue**: Only include if VERIFIED
- **revenue_confidence**: 'verified' only if from official source
- **revenue_source**: Cite the source

**Common Mistakes to Avoid:**
- ❌ Making up revenue numbers
- ❌ Using formula-based estimates without marking as estimated
- ❌ Claiming "verified" without a source

**Verification Steps:**
1. Search "[company] revenue" or "[company] ARR"
2. Check for founder interviews on podcasts
3. Look for IndieHackers posts (for bootstrapped)
4. Check press releases for milestones

### 5. Team/Founders
- **founder_background**: Founder names, roles, prior experience
- **team_composition**: Headcount by department

**Verification Steps:**
1. Check company about/team page
2. Look up founders on LinkedIn
3. Search for founder interviews

## Validation Rules

### Before Saving Any Data:

1. **Funding Validation**
   - If total_raised > 0, must have at least one funding_round entry
   - If is_bootstrapped = true, total_raised must be 0

2. **Acquisition Validation**
   - If was_acquired = true, acquired_by must not be null
   - Check that company isn't still operating independently

3. **Competitor Validation**
   - At least 3 competitors for any established company
   - Competitors should be in the same product category

4. **Revenue Validation**
   - If revenue_confidence = 'verified', revenue_source must not be null
   - Never use $500K as a default placeholder

## Data Quality Flags

Set `needs_review = true` when:
- Conflicting information between sources
- Only one source found
- Data is older than 12 months
- High-value claim without strong source

## Enrichment Process

### Step 1: Scrape Multiple Sources
```
1. Zyte scrape: TechCrunch search
2. Zyte scrape: Crunchbase profile
3. Zyte scrape: Company website
4. Zyte scrape: Google News (acquisition check)
```

### Step 2: Analyze with Gemini
```
- Provide all scraped content
- Ask for ONLY verified facts
- Require source citations
- Set low temperature (0.1) for factual accuracy
```

### Step 3: Validate Before Save
```
- Check is_bootstrapped vs total_raised consistency
- Verify was_acquired if exit news found
- Ensure competitors list is populated
- Confirm founder names exist
```

### Step 4: Track Data Quality
```
- Record sources checked
- Set confidence level
- Flag for review if needed
- Update data_verified_at timestamp
```

## Example: Correct vs Incorrect Data

### Magnific (AI Image Upscaler)

**INCORRECT (what bulk enrichment did):**
```json
{
  "total_raised": 3000000,
  "is_bootstrapped": false,
  "was_acquired": null,
  "competitors": null
}
```

**CORRECT (after proper verification):**
```json
{
  "total_raised": 0,
  "is_bootstrapped": true,
  "was_acquired": true,
  "acquired_by": "Freepik",
  "acquisition_date": "2024-06-01",
  "competitors": [
    {"name": "Topaz Labs", "overlap_pct": 90},
    {"name": "Let's Enhance", "overlap_pct": 85},
    {"name": "Upscayl", "overlap_pct": 75}
  ]
}
```

## Scheduled Enrichment

### Daily Tasks
- Check for acquisition news on high-value startups
- Update headcount from LinkedIn for trending companies
- Scrape TechCrunch for new funding announcements

### Weekly Tasks
- Re-verify companies with `needs_review = true`
- Update competitor landscape for fast-moving sectors (AI, Fintech)
- Check for IPO announcements

### Monthly Tasks
- Full re-enrichment of top 100 startups by funding
- Audit data quality metrics
- Update revenue estimates based on new information

