# Production House — Content Processing Pipeline Documentation

## Overview

The content processing pipeline is a comprehensive system for ingesting, processing, rewriting, and publishing syndicated content. It consists of 14 major components organized into a layered architecture:

1. **AI & Intelligence Layer** - Gemini integration for content rewriting
2. **Parsing Layer** - RSS, sitemap, and content extraction
3. **Processing Layer** - Deduplication, filtering, backlinks, social copy
4. **Orchestration Layer** - Fetch and rewrite pipelines
5. **Execution Layer** - Edge functions and API routes

---

## Component Architecture

### 1. AI & Intelligence Layer

#### `/src/lib/ai/gemini.ts`
Centralized Gemini AI client with four core functions:

**Functions:**
- `rewriteArticle(input)` - Rewrite articles with unique voice, SEO optimization, and brand context
  - Returns: `{ title, content, excerpt, metaDescription, tags, category }`
  - Uses gemini-2.0-flash model

- `generateSocialCopy(article, platform)` - Generate platform-specific social media copy
  - Returns: `{ copy, hashtags }`
  - Platform-aware formatting (LinkedIn, Facebook, X, Instagram, TikTok)

- `categorizeArticle(title, content, existingCategories)` - Intelligent content categorization
  - Returns: category name string
  - Creates new categories as needed

- `filterSalesContent(title, content)` - Detect promotional/sales content
  - Returns: `{ isSales: boolean, confidence: number }`

**Key Features:**
- Rate limiting aware
- Proper error handling with graceful degradation
- System prompts optimized for each task
- JSON response validation

---

### 2. Parsing Layer

#### `/src/lib/pipeline/parse-rss.ts`
RSS/Atom feed parser with multi-format support

**Function:**
- `parseRssFeed(url)` → `ParsedArticle[]`
  - Extracts: title, URL, content, author, publishedAt, imageUrl
  - Handles RSS 2.0 and Atom feeds
  - Extracts featured images from media:content, enclosure, og:image, or first `<img>`
  - 10-second timeout
  - Robust error handling per-item

**Supported Feed Types:**
- RSS 2.0
- Atom
- Media RSS extensions
- Multiple image sources

#### `/src/lib/pipeline/parse-sitemap.ts`
XML sitemap parser with recursive index support

**Function:**
- `parseSitemap(url)` → `SitemapUrl[]`
  - Returns: `{ url, lastmod, priority }`
  - Detects and recursively parses sitemap indexes
  - 10-second timeout
  - Handles various sitemap structures

**Features:**
- Recursive sitemap index parsing
- XML parsing via fast-xml-parser
- Timeout protection
- Comprehensive error handling

#### `/src/lib/pipeline/extract-content.ts`
Full-page article content extraction

**Function:**
- `extractArticleContent(url)` → `ExtractedContent`
  - Returns: `{ title, content, author, publishedDate, featuredImage }`
  - 10-second fetch timeout
  - Intelligent selector matching

**Content Extraction Strategy:**
1. Title: og:title → twitter:title → first h1 → page title
2. Author: meta author → .author-name → byline patterns
3. Date: article:published_time → meta tags → time elements
4. Image: og:image → twitter:image → article images → first image
5. Content: Uses CSS selectors (article, main, .post-content, etc.)

**Cleanup:**
- Removes scripts, styles, navs, footers, sidebars
- Strips ads and tracking elements
- Cleans HTML while preserving structure

---

### 3. Processing Layer

#### `/src/lib/pipeline/download-image.ts`
Image download and Supabase storage integration

**Function:**
- `downloadAndStoreImage(imageUrl, siteId, articleId)` → storage URL or null
  - Downloads with 10-second timeout
  - Max 5MB file size
  - Stores in: `article-images/{siteId}/{articleId}/{filename}`
  - Returns public Supabase URL
  - Fails gracefully (returns null, doesn't block article)

**Key Features:**
- Automatic extension detection from URL
- Content-type detection
- Graceful error handling
- Non-blocking failure mode

#### `/src/lib/pipeline/simhash.ts`
SimHash algorithm for near-duplicate detection

**Functions:**
- `computeSimHash(text)` → 64-bit hash string
  - Text normalization: lowercase, remove punctuation
  - Tokenization: unigrams + bigrams
  - Produces reproducible hash for content comparison

- `hammingDistance(hash1, hash2)` → number
  - Counts differing bits between hashes
  - Returns distance metric

- `isDuplicate(hash1, hash2, threshold=3)` → boolean
  - Default threshold: 3 bit differences
  - Configurable tolerance

**Algorithm:**
- Uses SHA-256 for token hashing
- Generates vector by checking bit presence
- Creates final fingerprint based on vector dimensions
- Hamming distance for similarity comparison

#### `/src/lib/pipeline/filter.ts`
Sales/promotional content filtering

**Function:**
- `filterContent(title, content)` → `{ shouldFilter: boolean, reason: string }`

**Detection Strategy (in order):**
1. Sales keywords: "buy now", "limited time", "discount", "promo", "sale", "coupon", "deal", etc.
2. Excessive uppercase: >30% of words are all-caps
3. Too many links: >10 hyperlinks in content
4. Price patterns: Regex for currency symbols with amounts
5. Gemini AI check: For borderline cases (confidence threshold 0.6-0.75)

#### `/src/lib/pipeline/backlink.ts`
Contextual backlink insertion

**Function:**
- `insertBacklink(content, settings, articleIndex)` → `BacklinkInsertResult`
  - Respects frequency setting (only every Nth article)
  - Placement types: 'inline', 'banner', 'both'

**Placement Strategies:**
- **Inline**: Inserts contextual link at ~60% point in article
- **Banner**: Appends styled banner div at end
- **Both**: Combines both approaches

**Features:**
- HTML escaping for security
- Styled banner with optional image
- Frequency-based insertion
- Natural paragraph break detection

#### `/src/lib/pipeline/social-copy.ts`
Platform-specific social media copy generation

**Function:**
- `generateSocialCopy(article, platforms)` → `{ copy: string, hashtags: string[] }`
  - Generates unified copy for all platforms
  - Uses Gemini for platform-aware generation
  - Returns single copy + combined hashtags

**Platform Configurations:**
- LinkedIn: Professional, 150-200 chars
- Facebook: Engaging, 100-150 chars
- X/Twitter: Punchy, max 280 chars
- Instagram: Hashtag-heavy, 150 chars + 10 tags
- TikTok: Casual, 100 chars

#### `/src/lib/pipeline/categorize.ts`
Intelligent article categorization

**Function:**
- `categorizeArticle(title, content, siteId, supabase)` → category_id
  - Checks existing site categories
  - Uses Gemini to select best category
  - Creates new categories as needed
  - Returns category ID

**Process:**
1. Fetch existing categories for site
2. Ask Gemini to categorize article
3. Check if category exists
4. Create category with slug if new
5. Return category ID

---

### 4. Orchestration Layer

#### `/src/lib/pipeline/fetch.ts`
Source fetching orchestrator

**Function:**
- `fetchAndProcessSources(siteId, supabase)` → `FetchStats`

**Process:**
1. Get all active sources for site
2. Parse RSS feeds or sitemaps
3. Check each article URL for duplicates
4. Insert new articles with status 'raw'
5. Update source statistics
6. Return fetch statistics

**Error Handling:**
- Per-source error catching
- Per-article error catching
- Source error logging
- Graceful continuation

**Returns:**
```typescript
{
  sourced: number,      // Total articles parsed
  newArticles: number,  // New articles inserted
  duplicates: number,   // Duplicate URLs found
  errors: number        // Processing errors
}
```

#### `/src/lib/pipeline/rewrite.ts`
Content rewriting orchestrator

**Function:**
- `rewriteRawArticles(siteId, supabase, limit?)` → `RewriteStats`

**Complete Processing Pipeline:**
1. Get site tone_of_voice and organization brand_summary
2. Fetch raw articles (up to articles_per_day)
3. For each article:
   - Extract full content from original URL (if needed)
   - Check for sales/promo content → mark 'filtered'
   - Compute SimHash → check duplicates → mark 'duplicate'
   - Rewrite with Gemini (respecting tone and brand context)
   - Auto-categorize article
   - Generate social copy for multiple platforms
   - Download and store featured image
   - Insert backlink (if enabled and frequency matches)
   - Generate slug
   - Update article with all fields
   - Set status to 'published'

**Error Handling:**
- Individual article errors don't stop batch
- Failed articles marked with status 'failed'
- Graceful image download failures
- Fallback values for missing data

**Returns:**
```typescript
{
  processed: number,   // Articles processed
  published: number,   // Successfully published
  filtered: number,    // Marked as sales content
  duplicates: number,  // Marked as duplicates
  errors: number       // Processing errors
}
```

---

### 5. Execution Layer

#### `/supabase/functions/fetch-sources/index.ts`
Edge function for scheduled source fetching

**Trigger:** Hourly via pg_cron

**Process:**
1. Get all sites with `cron_enabled=true` and `status='active'`
2. For each site: call `fetchAndProcessSources()`
3. Log job statistics to job_log table
4. Return results JSON

#### `/supabase/functions/fetch-sources/fetch-pipeline.ts`
Deno-compatible fetch implementation

**Note:** Simplified version for edge function environment
- Basic XML parsing for RSS feeds
- Recursive sitemap index parsing
- No external dependencies

#### `/supabase/functions/rewrite-articles/index.ts`
Edge function for scheduled rewriting

**Trigger:** Every 15 minutes via pg_cron

**Process:**
1. Get all sites with active status
2. For each site: get raw articles (up to articles_per_day)
3. For each article:
   - Extract content from URL
   - Check for sales content (simplified)
   - Rewrite with basic NLP
   - Update article status
4. Log statistics to job_log table

**Note:** Simplified for edge environment (no Gemini calls due to timeout constraints)

#### `/src/app/api/sources/[id]/fetch/route.ts`
Manual trigger API for fetching a single source

**Method:** POST

**Authentication:** Required (user must have access to source's organization)

**Process:**
1. Verify user authentication
2. Check user has access to source's organization
3. Call `fetchAndProcessSources()` for source's site
4. Update source's last_fetched_at timestamp
5. Log job to job_log table
6. Return statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "sourced": number,
    "newArticles": number,
    "duplicates": number,
    "errors": number
  }
}
```

#### `/src/app/api/articles/[id]/rewrite/route.ts`
Manual trigger API for rewriting a single article

**Method:** POST

**Authentication:** Required (user must have access to article's site)

**Process:**
1. Verify authentication and authorization
2. Extract full content from original URL
3. Check for sales content → return filtered if found
4. Compute SimHash → check duplicates → return duplicate if found
5. Rewrite with Gemini
6. Auto-categorize
7. Generate social copy
8. Download featured image
9. Insert backlink
10. Generate slug
11. Update article with all fields
12. Set status to 'published'

**Error Handling:**
- Marks failed articles with 'failed' status
- Returns error details in response

---

## Data Flow

### Fetch Pipeline
```
Source (RSS/Sitemap)
    ↓
Parse (parseRssFeed / parseSitemap)
    ↓
Article URLs Extracted
    ↓
Check for Existing URLs
    ↓
Insert New Articles (status: raw)
    ↓
Update Source Stats
```

### Rewrite Pipeline
```
Raw Articles
    ↓
Extract Full Content (extractArticleContent)
    ↓
Filter Sales Content (filterContent)
    ├─ If sales → Mark 'filtered'
    ↓
Compute SimHash
    ↓
Check for Duplicates (isDuplicate)
    ├─ If duplicate → Mark 'duplicate'
    ↓
Rewrite with Gemini (rewriteArticle)
    ↓
Auto-Categorize (categorizeArticle)
    ↓
Generate Social Copy (generateSocialCopy)
    ↓
Download Featured Image (downloadAndStoreImage)
    ↓
Insert Backlink (insertBacklink)
    ↓
Generate Slug
    ↓
Update Article (status: published)
```

---

## Database Integration

### Tables Used
- `articles` - Main article storage with status tracking
- `sources` - RSS/Sitemap sources with last_fetched_at
- `categories` - Content categories with auto-creation
- `sites` - Site configuration (tone_of_voice, articles_per_day)
- `organizations` - Brand context (brand_summary)
- `backlink_settings` - Backlink configuration per site
- `job_log` - Pipeline execution logs

### Key Indexes Created
- `articles_status_site_id_idx` - Fast status queries
- `articles_original_url_site_id_idx` - URL duplicate check
- `articles_content_hash_site_id_idx` - Content hash lookups
- `sources_site_id_is_active_idx` - Active source queries

---

## Configuration & Settings

### Environment Variables Required
```
GOOGLE_AI_API_KEY          # Gemini API key
SUPABASE_URL               # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY  # Admin access (server-only)
NEXT_PUBLIC_SUPABASE_URL   # Public Supabase URL
```

### Site Configuration
```typescript
{
  tone_of_voice: ToneOfVoice,    // professional, casual, authoritative, friendly, etc.
  articles_per_day: number,      // Max articles to process per cycle
  cron_enabled: boolean,         // Enable automatic fetching/rewriting
  status: 'active' | 'paused'    // Enable/disable site
}
```

### Backlink Settings
```typescript
{
  is_enabled: boolean,           // Enable backlinks
  target_url: string,            // Link destination
  link_text: string,             // Link display text
  placement_type: 'inline' | 'banner' | 'both',
  frequency: number,             // Insert every Nth article (1 = all)
  banner_text?: string,
  banner_image_url?: string
}
```

---

## Error Handling Strategy

### Per-Component Error Handling
All pipeline functions implement individual error handling:
- Errors don't cascade to other items in batch
- Errors are logged with context
- Failed articles are marked with appropriate status
- Source errors are recorded for debugging

### Graceful Degradation
- Missing images don't block article publication
- Failed categorization defaults to 'Uncategorized'
- Failed social copy generation uses article title
- Missing content extraction uses original_content fallback

### Status Markers
- `raw` - New article, awaiting processing
- `rewriting` - Currently being rewritten
- `published` - Successfully published
- `filtered` - Marked as sales/promotional
- `duplicate` - Duplicate content detected
- `failed` - Processing error occurred
- `pending` - Awaiting manual review
- `unpublished` - Published but later unpublished

---

## Performance Considerations

### Timeouts
- RSS/Sitemap fetching: 10 seconds
- Content extraction: 10 seconds
- Image download: 10 seconds
- API routes: 5 minutes (maxDuration)

### Batch Processing
- Limits articles per fetch/rewrite cycle (articles_per_day setting)
- Per-item error handling prevents cascading failures
- Indexing optimized for status and URL queries

### Rate Limiting
- Gemini API: Built-in rate limiting handling
- Multiple API calls batched where possible
- Social copy generation uses single call for all platforms

---

## Monitoring & Logging

### Job Logging
All pipeline executions logged to `job_log` table:
- `job_type`: fetch_sources, rewrite_articles, etc.
- `site_id`: Specific site (or null for global jobs)
- `status`: running, completed, failed
- `articles_fetched`: Count of articles sourced
- `articles_rewritten`: Count of articles rewritten
- `articles_published`: Count of articles published
- `error_message`: Error details if failed
- `started_at`: Execution start time
- `completed_at`: Execution end time
- `duration_ms`: Total execution duration

### Alert System
- Sales filter failures logged to `admin_alerts`
- Cron job failures trigger `cron_failure` alerts
- Critical errors generate `critical` severity alerts

---

## Future Extensions

The architecture supports these extensions:
1. **Multi-language support** - Extend Gemini prompts
2. **Custom post scheduling** - Add date-based publishing
3. **A/B testing** - Track social performance per platform
4. **Content scoring** - Engagement metrics per category
5. **Advanced deduplication** - Semantic similarity beyond SimHash
6. **Custom filtering rules** - User-defined content filters
7. **Image optimization** - Automated image resizing/compression
8. **SEO analysis** - Built-in SEO scoring and suggestions

---

## Troubleshooting

### Common Issues

**Articles stuck in 'raw' status:**
- Check articles_per_day setting on site
- Verify cron jobs are running (check job_log)
- Check for errors in edge function logs

**Duplicates not detected:**
- Verify content_hash is being computed
- Check SimHash threshold (default 3) is appropriate
- Ensure original articles have content_hash set

**Images not downloading:**
- Check image URL accessibility
- Verify 5MB size limit not exceeded
- Check Supabase storage bucket permissions
- Images failing won't block article (check featured_image_stored)

**Gemini API errors:**
- Verify GOOGLE_AI_API_KEY is set
- Check rate limiting (quota exceeded)
- Ensure prompt tokens within model limits

**Sales filter false positives:**
- Adjust Gemini confidence threshold
- Review sales keyword list
- Check uppercase detection threshold

---

## Testing

### Manual Testing

**Fetch sources:**
```bash
curl -X POST http://localhost:3000/api/sources/[source-id]/fetch \
  -H "Authorization: Bearer [token]"
```

**Rewrite article:**
```bash
curl -X POST http://localhost:3000/api/articles/[article-id]/rewrite \
  -H "Authorization: Bearer [token]"
```

### Batch Testing
- Create test site with small articles_per_day
- Monitor job_log for execution details
- Check article statuses after processing
- Verify content hashes and social copy generated

---

## Security

### Key Principles
1. **Server-side only**: Admin client never exposed to browser
2. **RLS enforcement**: All queries respect Row Level Security
3. **Rate limiting**: Gemini API has built-in protection
4. **HTML escaping**: All user content escaped before insertion
5. **Input validation**: All URLs validated before fetch
6. **Timeout protection**: All external requests have timeout limits

### Access Control
- Fetch/rewrite APIs verify user organization access
- Source fetch requires user authentication
- Article rewrite requires user authentication
- Edge functions use service role (internal only)

---

## Deployment Checklist

- [ ] Environment variables configured (GOOGLE_AI_API_KEY, Supabase keys)
- [ ] Storage bucket "article-images" created
- [ ] Migration 004_cron.sql applied
- [ ] Edge functions deployed (fetch-sources, rewrite-articles)
- [ ] API routes accessible (/api/sources/[id]/fetch, /api/articles/[id]/rewrite)
- [ ] Cron jobs active (check pg_cron schedules)
- [ ] Test with single source and article first
- [ ] Monitor job_log table for success
- [ ] Check article statuses transitioned correctly

---

## API Reference

### POST /api/sources/[id]/fetch
Manually trigger fetch for a single source

**Response:**
```json
{
  "success": true,
  "stats": {
    "sourced": 10,
    "newArticles": 5,
    "duplicates": 3,
    "errors": 2
  }
}
```

### POST /api/articles/[id]/rewrite
Manually trigger rewrite for a single article

**Response:**
```json
{
  "success": true,
  "status": "published",
  "article": {
    "id": "uuid",
    "title": "Rewritten Title",
    "slug": "rewritten-title"
  }
}
```

---

## Conclusion

The content processing pipeline is a production-ready system designed for reliable, scalable content syndication. All components implement comprehensive error handling, support for various content sources and formats, and integration with modern AI APIs for high-quality content transformation.
