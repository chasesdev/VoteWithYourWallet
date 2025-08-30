# Political Data Scraper

This system collects real political activity data from multiple legitimate sources including:

## Data Sources

### 1. FEC (Federal Election Commission)
- **Purpose**: Corporate political donations and contributions
- **API**: https://api.open.fec.gov/v1/
- **Rate Limit**: 1000 requests/hour
- **Data Quality**: Very High (official government data)

### 2. OpenSecrets.org
- **Purpose**: Lobbying expenditures and political spending
- **API**: https://www.opensecrets.org/api/
- **Rate Limit**: Conservative (200 requests/hour)
- **Data Quality**: High (compiled from official disclosures)

### 3. NewsAPI
- **Purpose**: Political statements, endorsements, and corporate political positions
- **API**: https://newsapi.org/v2/
- **Rate Limit**: Varies by plan (100-1000 requests/hour)
- **Data Quality**: Medium (requires validation)

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# FEC API Key (Free - register at https://api.open.fec.gov/developers/)
FEC_API_KEY=your_fec_api_key

# OpenSecrets API Key (Free - register at https://www.opensecrets.org/api/admin/index.php?function=signup)
OPENSECRETS_API_KEY=your_opensecrets_key

# News API Key (Free tier available - https://newsapi.org/register)
NEWS_API_KEY=your_news_api_key
```

### 2. Database Migration

Generate and run the database migration for the new political activity table:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration  
npx drizzle-kit migrate
```

### 3. Initialize Data Sources

```bash
npx ts-node scripts/setup-data-sources.ts
```

## Usage

### Scrape All Businesses
```bash
npm run scrape:political:all
```

### Scrape Specific Business
```bash
npm run scrape:political:business -- <business_id> "<business_name>"
```

### Example
```bash
npm run scrape:political:business -- 1 "Starbucks Corporation"
```

## Data Collection Details

### FEC Data
- Corporate contributions to federal candidates
- PAC donations
- Independent expenditures
- Confidence: 95% (official government data)

### Lobbying Data  
- Quarterly lobbying expenditures
- Lobbying firm relationships
- Policy areas targeted
- Confidence: 90% (from official disclosures)

### News/Statement Data
- Corporate political statements
- CEO endorsements
- Policy position announcements  
- Confidence: 70% (requires manual validation)

## Data Quality & Validation

The scraper includes several data quality measures:

1. **Deduplication**: Removes duplicate entries based on business, date, title, and type
2. **Confidence Scoring**: Each record includes a confidence score (0-1)
3. **Source Verification**: Tracks original source URLs for verification
4. **Manual Review Flags**: Low-confidence items flagged for review

## Rate Limiting

The system respects API rate limits:
- FEC: 1000 requests/hour
- OpenSecrets: 200 requests/hour  
- NewsAPI: 100 requests/hour (free tier)
- 2-second delay between businesses

## Legal & Ethical Considerations

This scraper:
- ✅ Uses only public, legally available data
- ✅ Respects API terms of service and rate limits
- ✅ Provides proper attribution and source links
- ✅ Focuses on transparency and public accountability
- ✅ Does not collect private or non-public information

## Monitoring & Logs

All scraping activities are logged in the `sync_logs` table:
- Records processed/added/failed
- Duration and performance metrics
- Error messages for debugging

## Automated Scheduling

To run the scraper regularly, set up a cron job or scheduled task:

```bash
# Daily at 2 AM
0 2 * * * cd /path/to/project && npm run scrape:political:all

# Weekly for all businesses  
0 2 * * 0 cd /path/to/project && npm run scrape:political:all
```

## API Integration

The scraped data is automatically available through your existing API endpoint:
- `GET /api/businesses/{id}/political-activity`

No additional frontend changes needed - the political activity timeline will now show real data!