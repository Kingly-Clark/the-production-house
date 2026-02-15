# Pipeline Types Reference Guide

This guide details all TypeScript types and interfaces used throughout the content processing pipeline.

## Core Pipeline Types

### RSS Parser Types

```typescript
interface ParsedArticle {
  title: string;           // Article title
  url: string;            // Article URL (required)
  content: string;        // HTML content from RSS
  author: string | null;  // Author name if available
  publishedAt: string | null;  // ISO date string
  imageUrl: string | null;     // Featured image URL
}
```

### Sitemap Parser Types

```typescript
interface SitemapUrl {
  url: string;            // Page URL
  lastmod: string | null; // Last modification date
  priority: number | null; // Priority value (0-1)
}
```

### Content Extraction Types

```typescript
interface ExtractedContent {
  title: string;                 // Extracted page title
  content: string;              // Cleaned HTML content
  author: string | null;        // Author from meta tags/byline
  publishedDate: string | null; // Publication date
  featuredImage: string | null; // Featured image URL
}
```

### AI/Gemini Types

```typescript
// Input to rewriteArticle function
interface RewriteInput {
  title: string;        // Original article title
  content: string;      // Original article content
  tone: string;         // Tone of voice (from site settings)
  brandSummary: string | null;  // Organization brand context
}

// Output from rewriteArticle function
interface RewriteOutput {
  title: string;           // Rewritten, SEO-optimized title
  content: string;         // Rewritten content (HTML)
  excerpt: string;         // 2-3 sentence excerpt
  metaDescription: string; // 150-160 char meta description
  tags: string[];          // 5-7 content tags
  category: string;        // Primary category suggestion
}

// Output from generateSocialCopy function
interface SocialCopyOutput {
  copy: string;        // Platform-appropriate copy
  hashtags: string[];  // Relevant hashtags
}

// Output from filterSalesContent function
interface FilterOutput {
  isSales: boolean;    // Is this sales content?
  confidence: number;  // Confidence score (0-1)
}
```

### Image Handler Types

```typescript
// Returns storage path or null if download failed
function downloadAndStoreImage(
  imageUrl: string,
  siteId: string,
  articleId: string
): Promise<string | null>
```

### SimHash Types

```typescript
// 64-character binary string (e.g., "1011010110...")
function computeSimHash(text: string): string

// Integer distance metric
function hammingDistance(hash1: string, hash2: string): number

// Returns true if hashes are similar (within threshold)
function isDuplicate(
  hash1: string,
  hash2: string,
  threshold?: number  // default: 3
): boolean
```

### Filter Types

```typescript
interface FilterResult {
  shouldFilter: boolean;  // Should this content be filtered?
  reason: string;         // Human-readable reason
}
```

Typical reasons:
- "Contains sales keywords"
- "Excessive uppercase text (>30%)"
- "Too many links in content (>10)"
- "Detected as sales content by AI (price mentions)"
- "Detected as sales content by AI"

### Backlink Types

```typescript
interface BacklinkInsertResult {
  modifiedContent: string;  // Content with backlink inserted
  inserted: boolean;        // Was backlink actually inserted?
}

// From database: BacklinkSettings
interface BacklinkSettings {
  id: string;
  site_id: string;
  is_enabled: boolean;
  target_url: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  link_text: string | null;
  placement_type: 'inline' | 'banner' | 'both';
  frequency: number;  // Insert on every Nth article (1 = all)
  created_at: string;
  updated_at: string;
}
```

### Social Copy Generator Types

```typescript
interface Article {
  // Minimal properties needed for social copy
  title: string | null;
  excerpt: string | null;
  content: string | null;
  // ... other article properties
}

// Platform strings accepted
type SocialPlatform = 'linkedin' | 'facebook' | 'x' | 'instagram' | 'tiktok';
```

### Categorize Types

```typescript
// Returns a category_id string
function categorizeArticle(
  title: string,
  content: string,
  siteId: string,
  supabase: SupabaseClient<Database>
): Promise<string>
```

### Pipeline Orchestrator Types

```typescript
interface FetchStats {
  sourced: number;      // Total articles from sources
  newArticles: number;  // New articles inserted
  duplicates: number;   // Duplicate URLs found
  errors: number;       // Processing errors encountered
}

interface RewriteStats {
  processed: number;    // Articles processed
  published: number;    // Successfully published
  filtered: number;     // Marked as sales content
  duplicates: number;   // Marked as duplicates
  errors: number;       // Processing errors
}
```

## Database Types

From `/src/types/database.ts`:

### Article Status Type

```typescript
type ArticleStatus =
  | 'raw'         // New article awaiting processing
  | 'rewriting'   // Currently being rewritten
  | 'pending'     // Awaiting manual review
  | 'published'   // Published and visible
  | 'unpublished' // Published but hidden
  | 'failed'      // Processing failed
  | 'duplicate'   // Duplicate detected
  | 'filtered';   // Filtered as promotional
```

### Tone of Voice Type

```typescript
type ToneOfVoice =
  | 'professional'
  | 'casual'
  | 'authoritative'
  | 'friendly'
  | 'witty'
  | 'formal'
  | 'conversational';
```

### Source Type

```typescript
type SourceType = 'rss' | 'sitemap';
```

### Job Type and Status

```typescript
type JobType =
  | 'fetch_sources'
  | 'rewrite_articles'
  | 'publish_articles'
  | 'post_social'
  | 'send_newsletter'
  | 'check_domains';

type JobStatus = 'running' | 'completed' | 'failed';
```

### Article Table Structure

```typescript
interface Article {
  id: string;
  site_id: string;
  source_id: string | null;

  // Original content
  original_title: string;
  original_url: string;
  original_content: string | null;
  original_author: string | null;
  original_published_at: string | null;

  // Rewritten content
  title: string | null;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_stored: string | null;

  // Metadata
  category_id: string | null;
  tags: string[];
  status: ArticleStatus;
  has_backlink: boolean;

  // Social media
  social_posted: boolean;
  social_posted_at: string | null;
  social_copy: string | null;
  social_hashtags: string[];

  // Deduplication
  content_hash: string | null;
  similarity_score: number | null;

  // Analytics
  view_count: number;
  published_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### Site Table Structure

```typescript
interface Site {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  header_text: string | null;
  template_id: TemplateId;
  tone_of_voice: ToneOfVoice;  // Used in rewrite pipeline
  status: SiteStatus;
  articles_per_day: number;    // Limits batch processing
  cron_enabled: boolean;       // Controls scheduled jobs
  created_at: string;
  updated_at: string;
}
```

### Organization Table Structure

```typescript
interface Organization {
  id: string;
  name: string;
  website_url: string | null;
  brand_summary: string | null;  // Used in Gemini rewrite
  brand_colors: Record<string, string>;
  logo_url: string | null;
  favicon_url: string | null;
  stripe_customer_id: string | null;
  plan_status: OrganizationStatus;
  max_sites: number;
  created_at: string;
  updated_at: string;
}
```

### Source Table Structure

```typescript
interface Source {
  id: string;
  site_id: string;
  url: string;                // RSS feed or sitemap URL
  source_type: SourceType;    // 'rss' or 'sitemap'
  name: string | null;
  is_active: boolean;         // Controls processing
  is_validated: boolean;
  last_fetched_at: string | null;
  last_error: string | null;  // Error message
  article_count: number;      // Articles sourced
  created_at: string;
  updated_at: string;
}
```

### Category Table Structure

```typescript
interface Category {
  id: string;
  site_id: string;
  name: string;
  slug: string;               // Generated from name
  article_count: number;      // Auto-updated
  created_at: string;
}
```

### Job Log Table Structure

```typescript
interface JobLog {
  id: string;
  job_type: JobType;
  site_id: string | null;
  status: JobStatus;
  articles_fetched: number;
  articles_rewritten: number;
  articles_published: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}
```

## Supabase Client Types

```typescript
// Server-side client (with auth)
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// Admin client (bypasses RLS)
import { createAdminClient } from '@/lib/supabase/admin';
const supabase = createAdminClient();

// Type-safe queries
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('site_id', siteId);

// Type: Article[] (from database.ts)
```

## Platform Configuration Types

```typescript
interface PlatformConfig {
  linkedin: {
    maxChars: 200;
    tone: 'professional, industry-focused, thought leadership';
  };
  facebook: {
    maxChars: 150;
    tone: 'engaging, conversational, community-focused';
  };
  x: {
    maxChars: 280;
    tone: 'punchy, witty, concise';
  };
  instagram: {
    maxChars: 150;
    tone: 'visual-first, hashtag-heavy, trendy';
  };
  tiktok: {
    maxChars: 100;
    tone: 'casual, trendy, Gen-Z friendly';
  };
}
```

## Edge Function Response Types

```typescript
// Fetch sources edge function response
interface FetchSourcesResponse {
  success: boolean;
  sites: number;                    // Number of sites processed
  totalArticles: number;            // Total new articles
  errors: string[] | null;
}

// Rewrite articles edge function response
interface RewriteArticlesResponse {
  success: boolean;
  published: number;
  filtered: number;
  errors: number;
}
```

## API Route Response Types

```typescript
// POST /api/sources/[id]/fetch
interface FetchSourceResponse {
  success: true;
  stats: FetchStats;
}

// POST /api/articles/[id]/rewrite
interface RewriteArticleResponse {
  success: true;
  status: 'published' | 'filtered' | 'duplicate';
  article?: {
    id: string;
    title: string;
    slug: string;
  };
  reason?: string;  // For filtered/duplicate
}
```

## Error Types

All pipeline functions throw detailed errors:

```typescript
// Example error handling
try {
  const stats = await rewriteRawArticles(siteId, supabase);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);  // Specific error
  }
}
```

Common error messages:
- "GOOGLE_AI_API_KEY environment variable is required"
- "HTTP {status}: {statusText}"
- "Image size {size} exceeds maximum {limit}"
- "Missing Supabase credentials"
- "Article not found"
- "Forbidden"
- "Unauthorized"

## Type Imports

Import types from their respective modules:

```typescript
// AI types
import type { RewriteInput, RewriteOutput } from '@/lib/ai/gemini';

// Parser types
import type { ParsedArticle } from '@/lib/pipeline/parse-rss';
import type { SitemapUrl } from '@/lib/pipeline/parse-sitemap';
import type { ExtractedContent } from '@/lib/pipeline/extract-content';

// Pipeline types
import type { FilterResult } from '@/lib/pipeline/filter';
import type { BacklinkInsertResult } from '@/lib/pipeline/backlink';
import type { SocialCopyResult } from '@/lib/pipeline/social-copy';
import type { FetchStats } from '@/lib/pipeline/fetch';
import type { RewriteStats } from '@/lib/pipeline/rewrite';

// Database types
import type { Article, Site, Organization, Category } from '@/types/database';
```

---

## Type Safety Notes

1. **Never expose service role key to browser** - Use `createAdminClient()` server-side only
2. **All Supabase queries are type-safe** - Leverage TypeScript for compile-time errors
3. **Date strings are ISO 8601** - Use with `new Date(dateString)` for conversion
4. **Arrays in database** - `tags`, `social_hashtags` stored as PostgreSQL arrays
5. **Null vs undefined** - Database fields use `null`, not `undefined`
6. **String unions** - Use string literal types for status values
7. **BigInt for hashes** - SimHash uses string representation, not actual BigInt

---

## Performance Notes

- **Keep article batches small** - articles_per_day limits prevent memory issues
- **Timeouts are hard limits** - 10 seconds for fetches, adjust if needed
- **Database indexes** - Use indexed fields in WHERE clauses (status, site_id, original_url)
- **Error handling** - Individual errors shouldn't block batch processing

---

## Validation Rules

### Before Insertion
- `original_url` - Must be valid HTTP(S) URL
- `original_title` - Required, non-empty string
- `site_id` - Must exist in sites table
- `content_hash` - Optional but recommended

### During Rewrite
- `tone_of_voice` - Must be valid ToneOfVoice enum value
- `tags` - Array of strings (0-7 recommended)
- `category_id` - Must exist or be null

### For Social Copy
- `title` - Max 280 characters (varies by platform)
- `hashtags` - Max 10 recommended
- `copy` - Platform-specific length limits

---

## Common Type Patterns

### Processing a batch with error handling

```typescript
const stats: RewriteStats = {
  processed: 0,
  published: 0,
  filtered: 0,
  duplicates: 0,
  errors: 0,
};

for (const article of articles) {
  try {
    // Process individual article
    stats.processed++;
    // ... success case
    stats.published++;
  } catch (error) {
    stats.errors++;
    console.error(`Error processing ${article.id}:`, error);
    // Continue to next article
  }
}

return stats;
```

### Type-safe Supabase query

```typescript
const { data, error }: SupabaseQueryResult<Article[]> =
  await supabase
    .from('articles')
    .select('*')
    .eq('status', 'raw')
    .limit(10);

if (error) throw error;
if (!data) return [];

// data is now strongly typed as Article[]
```

### Working with timestamps

```typescript
const article: Article = {
  // ...
  published_at: new Date().toISOString(),  // Current time
  updated_at: new Date().toISOString(),
};

// Parsing back
const publishDate = new Date(article.published_at!);
```
