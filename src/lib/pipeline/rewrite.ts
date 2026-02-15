import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Article } from '@/types/database';
import { extractArticleContent } from './extract-content';
import { rewriteArticle } from '@/lib/ai/gemini';
import { filterContent } from './filter';
import { computeSimHash, isDuplicate } from './simhash';
import { downloadAndStoreImage } from './download-image';
import { insertBacklink } from './backlink';
import { categorizeArticle } from './categorize';
import slugify from 'slugify';
import crypto from 'crypto';

interface RewriteStats {
  processed: number;
  published: number;
  filtered: number;
  duplicates: number;
  errors: number;
}

export async function rewriteRawArticles(
  siteId: string,
  supabase: SupabaseClient<Database>,
  limit?: number
): Promise<RewriteStats> {
  const stats: RewriteStats = {
    processed: 0,
    published: 0,
    filtered: 0,
    duplicates: 0,
    errors: 0,
  };

  try {
    // Get site details for tone_of_voice
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      console.error('Error fetching site:', siteError);
      stats.errors++;
      return stats;
    }

    // Get organization for brand_summary
    const { data: org } = await supabase
      .from('organizations')
      .select('brand_summary')
      .eq('id', site.organization_id)
      .single();

    const brandSummary = org?.brand_summary || null;
    const articlesPerDay = limit || site.articles_per_day || 10;

    // Get articles that need rewriting (raw, failed, or filtered)
    const { data: rawArticles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('site_id', siteId)
      .in('status', ['raw', 'failed', 'filtered'])
      .limit(articlesPerDay);

    if (articlesError) {
      console.error('Error fetching raw articles:', articlesError);
      stats.errors++;
      return stats;
    }

    if (!rawArticles || rawArticles.length === 0) {
      console.log(`No raw articles found for site ${siteId}`);
      return stats;
    }

    // Get backlink settings
    const { data: backlinkSettings } = await supabase
      .from('backlink_settings')
      .select('*')
      .eq('site_id', siteId)
      .single();

    // Process each article
    for (let index = 0; index < rawArticles.length; index++) {
      const article = rawArticles[index];

      try {
        stats.processed++;

        // Extract full content if not already done
        let extractedContent = article.original_content;
        let featuredImageUrl = article.featured_image_url;
        if (!extractedContent && article.original_url) {
          try {
            const extracted = await extractArticleContent(article.original_url);
            extractedContent = extracted.content;
            // Capture featured image if not already set
            if (!featuredImageUrl && extracted.featuredImage) {
              featuredImageUrl = extracted.featuredImage;
            }
          } catch (error) {
            console.error(`Error extracting content: ${error instanceof Error ? error.message : String(error)}`);
            stats.errors++;
            continue;
          }
        }

        // Check for sales/promo content
        const filterResult = await filterContent(article.original_title, extractedContent || '');
        if (filterResult.shouldFilter) {
          await supabase.from('articles').update({ status: 'filtered' }).eq('id', article.id);
          stats.filtered++;
          continue;
        }

        // Compute SimHash for duplicate detection
        const contentHash = computeSimHash(extractedContent || article.original_title);

        // Check for duplicate content
        const { data: similarArticles } = await supabase
          .from('articles')
          .select('id, content_hash, similarity_score')
          .eq('site_id', siteId)
          .neq('id', article.id)
          .in('status', ['published', 'pending']);

        let isDuplicateContent = false;
        for (const similar of similarArticles || []) {
          if (similar.content_hash && isDuplicate(contentHash, similar.content_hash, 3)) {
            isDuplicateContent = true;
            break;
          }
        }

        if (isDuplicateContent) {
          await supabase.from('articles').update({ status: 'duplicate' }).eq('id', article.id);
          stats.duplicates++;
          continue;
        }

        // Rewrite article with Gemini (single API call: rewrite + category + social copy)
        let rewrittenArticle;
        try {
          rewrittenArticle = await rewriteArticle({
            title: article.original_title,
            content: extractedContent || '',
            tone: site.tone_of_voice,
            brandSummary,
          });
        } catch (error) {
          console.error(`Error rewriting article: ${error instanceof Error ? error.message : String(error)}`);
          stats.errors++;
          continue;
        }

        // Resolve category from the AI-suggested name (no extra Gemini call)
        let categoryId: string | null = null;
        try {
          categoryId = await categorizeArticle(
            rewrittenArticle.title,
            rewrittenArticle.category || 'Uncategorized',
            siteId,
            supabase
          );
        } catch (error) {
          console.error(`Error categorizing article: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Use social copy from the combined rewrite response
        const socialCopy = rewrittenArticle.socialCopy || '';
        const socialHashtags = rewrittenArticle.socialHashtags || [];

        // Download and store featured image
        let storedImageUrl: string | null = null;
        if (featuredImageUrl) {
          try {
            storedImageUrl = await downloadAndStoreImage(featuredImageUrl, siteId, article.id);
          } catch (error) {
            console.error(`Error downloading image: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Insert backlink if enabled
        let contentWithBacklink = rewrittenArticle.content;
        let hasBacklink = false;
        if (backlinkSettings && backlinkSettings.is_enabled) {
          try {
            const backlink = insertBacklink(rewrittenArticle.content, backlinkSettings, index);
            contentWithBacklink = backlink.modifiedContent;
            hasBacklink = backlink.inserted;
          } catch (error) {
            console.error(`Error inserting backlink: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Generate slug
        const slug = slugify(rewrittenArticle.title, { lower: true, strict: true });

        // Update article with rewritten content
        const { error: updateError } = await supabase.from('articles').update({
          title: rewrittenArticle.title,
          slug,
          content: contentWithBacklink,
          excerpt: rewrittenArticle.excerpt,
          meta_description: rewrittenArticle.metaDescription,
          tags: rewrittenArticle.tags,
          category_id: categoryId,
          featured_image_url: featuredImageUrl,
          featured_image_stored: storedImageUrl,
          status: 'published',
          published_at: new Date().toISOString(),
          social_copy: socialCopy,
          social_hashtags: socialHashtags,
          has_backlink: hasBacklink,
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        });

        if (updateError) {
          console.error(`Error updating article: ${updateError.message}`);
          stats.errors++;
        } else {
          stats.published++;
        }
      } catch (error) {
        console.error(
          `Error processing article ${article.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        stats.errors++;

        // Mark as failed
        try {
          await supabase
            .from('articles')
            .update({
              status: 'failed',
            })
            .eq('id', article.id);
        } catch (updateError) {
          console.error('Error marking article as failed:', updateError);
        }
      }
    }
  } catch (error) {
    console.error(
      `Error in rewriteRawArticles: ${error instanceof Error ? error.message : String(error)}`
    );
    stats.errors++;
  }

  return stats;
}
