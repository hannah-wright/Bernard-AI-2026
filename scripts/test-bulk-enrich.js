/**
 * Test script for bulk-enrich function
 * 
 * Run with: node scripts/test-bulk-enrich.js
 * 
 * You need to set SUPABASE_SERVICE_ROLE_KEY env var first:
 * $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
 */

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY = "your-key-here"');
  process.exit(1);
}

async function testBulkEnrich() {
  console.log('🚀 Testing bulk-enrich function...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/bulk-enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        batch_size: 3,  // Small batch for testing
        offset: 0,
        dry_run: false  // Set to true to test without saving
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data);
      return;
    }

    console.log('✅ Success!\n');
    console.log('📊 Results:');
    console.log(`   Processed: ${data.processed}`);
    console.log(`   Succeeded: ${data.succeeded}`);
    console.log(`   Failed: ${data.failed}`);
    console.log(`   Verified Revenue: ${data.verifiedRevenue}`);
    console.log(`   Estimated Revenue: ${data.estimatedRevenue}`);
    
    console.log('\n📝 Details:');
    data.details?.forEach(d => {
      const confidence = d.revenue_confidence ? ` [${d.revenue_confidence}]` : '';
      const source = d.revenue_source ? ` - ${d.revenue_source.substring(0, 50)}...` : '';
      console.log(`   ${d.status === 'success' ? '✓' : '✗'} ${d.name}${confidence}${source}`);
    });

    console.log('\n📈 Progress:');
    console.log(`   Total remaining: ${data.progress?.totalRemaining}`);
    console.log(`   Has more: ${data.progress?.hasMore}`);
    if (data.progress?.hasMore) {
      console.log(`   Next offset: ${data.progress?.nextOffset}`);
    }

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

testBulkEnrich();

