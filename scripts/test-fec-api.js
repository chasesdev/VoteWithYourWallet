require('dotenv').config();

/**
 * Test FEC API to see if we can get real political donation data
 */
async function testFECAPI() {
  const apiKey = process.env.FEC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FEC_API_KEY not found in environment variables');
    return;
  }

  console.log('🔍 Testing FEC API with key:', apiKey.substring(0, 8) + '...');

  try {
    // Test with a well-known company that likely has political contributions
    const testCompanies = ['Starbucks', 'Microsoft', 'Amazon', 'Apple'];
    
    for (const company of testCompanies) {
      console.log(`\n📊 Searching for ${company} political contributions...`);
      
      const url = `https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=${apiKey}&contributor_name=${encodeURIComponent(company)}&per_page=5&sort_hide_null=false&sort_nulls_last=false&sort=-contribution_receipt_date`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ API Error for ${company}:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      const results = data.results || [];
      
      console.log(`✅ Found ${results.length} recent contributions for ${company}`);
      
      if (results.length > 0) {
        console.log('\n📋 Sample contributions:');
        results.slice(0, 3).forEach((donation, i) => {
          console.log(`  ${i + 1}. $${donation.contribution_receipt_amount?.toLocaleString() || 'N/A'} to ${donation.committee?.name || 'Unknown Committee'}`);
          console.log(`     Date: ${donation.contribution_receipt_date || 'N/A'}`);
          console.log(`     Cycle: ${donation.election_cycle || 'N/A'}`);
        });
        
        // Show we found real data!
        console.log('\n🎉 SUCCESS! Found real political donation data');
        break;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error('❌ Error testing FEC API:', error.message);
  }
}

/**
 * Test News API 
 */
async function testNewsAPI() {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ NEWS_API_KEY not found in environment variables');
    return;
  }

  console.log('\n🔍 Testing News API with key:', apiKey.substring(0, 8) + '...');

  try {
    const query = '"Starbucks" AND (political OR donation OR endorsement)';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}&pageSize=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ News API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const articles = data.articles || [];
    
    console.log(`✅ Found ${articles.length} recent political news articles`);
    
    if (articles.length > 0) {
      console.log('\n📰 Sample articles:');
      articles.slice(0, 2).forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.title}`);
        console.log(`     Source: ${article.source?.name || 'Unknown'}`);
        console.log(`     Date: ${article.publishedAt?.split('T')[0] || 'N/A'}`);
      });
      
      console.log('\n🎉 SUCCESS! Found real political news data');
    }
    
  } catch (error) {
    console.error('❌ Error testing News API:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Political Data Collection APIs\n');
  
  await testFECAPI();
  await testNewsAPI();
  
  console.log('\n✨ API tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run database migration: npm run db:migrate');
  console.log('2. Setup data sources: npm run setup:data-sources');
  console.log('3. Start collecting real data: npm run scrape:political:business -- 1 "Starbucks"');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFECAPI, testNewsAPI };