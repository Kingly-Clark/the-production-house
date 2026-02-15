import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractArticleContent } from '@/lib/pipeline/extract-content';
import { rewriteArticle } from '@/lib/ai/gemini';
import { computeSimHash, isDuplicate } from '@/lib/pipeline/simhash';
import { categorizeArticle } from '@/lib/pipeline/categorize';
import { insertBacklink } from '@/lib/pipeline/backlink';
import slugify from 'slugify';

export const maxDuration = 300; // 5 minute timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { articleIds } = body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: 'articleIds array is required' },
        { status: 400 }
      );
    }

    if (articleIds.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 articles can be rewritten at once' },
        { status: 400 }
      );
    }

    // Fetch the articles
    const { data: articles, error: articlesError } = await adminClient
      .from('articles')
      .select('*')
      .in('id', articleIds);

    if (articlesError || !articles || articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found' },
        { status: 404 }
      );
    }

    // Get the site (all articles should be from the same site)
    const siteId = articles[0].site_id;
    const { data: site } = await adminClient
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get organization brand summary
    const { data: org } = await adminClient
      .from('organizations')
      .select('brand_summary')
      .eq('id', site.organization_id)
      .single();

    const brandSummary = org?.brand_summary || null;

    // Get backlink settings
    const { data: backlinkSettings } = await adminClient
      .from('backlink_settings')
      .select('*')
      .eq('site_id', siteId)
      .single();

    // Mark articles as rewriting
    await adminClient
      .from('articles')
      .update({ status: 'rewriting' })
      .in('id', articleIds);

    const results: { id: string; status: string; title?: string; error?: string }[] = [];

    for (let index = 0; index < articles.length; index++) {
      const article = articles[index];

      try {
        // Extract content if needed
        let extractedContent = article.original_content;
        let featuredImageUrl = article.featured_image_url;
        if (!extractedContent && article.original_url) {
          try {
            const extracted = await extractArticleContent(article.original_url);
            extractedContent = extracted.content;
            if (!featuredImageUrl && extracted.featuredImage) {
              featuredImageUrl = extracted.featuredImage;
            }
          } catch {
            // Continue with what we have
          }
        }

        // Skip filter — user explicitly selected this article for rewriting

        // Duplicate check
        const contentHash = computeSimHash(extractedContent || article.original_title);
        const { data: similarArticles } = await adminClient
          .from('articles')
          .select('id, content_hash')
          .eq('site_id', siteId)
          .neq('id', article.id)
          .in('status', ['published', 'pending']);

        let isDup = false;
        for (const similar of similarArticles || []) {
          if (similar.content_hash && isDuplicate(contentHash, similar.content_hash, 3)) {
            isDup = true;
            break;
          }
        }

        if (isDup) {
          await adminClient.from('articles').update({ status: 'duplicate' }).eq('id', article.id);
          results.push({ id: article.id, status: 'duplicate' });
          continue;
        }

        // Rewrite with Gemini
        const rewritten = await rewriteArticle({
          title: article.original_title,
          content: extractedContent || '',
          tone: site.tone_of_voice,
          brandSummary,
        });

        // Resolve category from the AI-suggested name (no extra Gemini call)
        let categoryId: string | null = null;
        try {
          categoryId = await categorizeArticle(
            rewritten.title,
            rewritten.category || 'Uncategorized',
            siteId,
            adminClient
          );
        } catch {
          // Non-critical
        }

        // Use social copy from the combined rewrite response
        const socialCopy = rewritten.socialCopy || '';
        const socialHashtags = rewritten.socialHashtags || [];

        // Backlinks
        let contentWithBacklink = rewritten.content;
        let hasBacklink = false;
        if (backlinkSettings && backlinkSettings.is_enabled) {
          try {
            const backlink = insertBacklink(rewritten.content, backlinkSettings, index);
            contentWithBacklink = backlink.modifiedContent;
            hasBacklink = backlink.inserted;
          } catch {
            // Non-critical
          }
        }

        const slug = slugify(rewritten.title, { lower: true, strict: true });

        // Update article
        await adminClient.from('articles').update({
          title: rewritten.title,
          slug,
          content: contentWithBacklink,
          excerpt: rewritten.excerpt,
          meta_description: rewritten.metaDescription,
          tags: rewritten.tags,
          category_id: categoryId,
          featured_image_url: featuredImageUrl,
          status: 'published',
          published_at: new Date().toISOString(),
          social_copy: socialCopy,
          social_hashtags: socialHashtags,
          has_backlink: hasBacklink,
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        }).eq('id', article.id);

        results.push({ id: article.id, status: 'published', title: rewritten.title });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error rewriting article ${article.id}:`, message);

        await adminClient.from('articles').update({ status: 'failed' }).eq('id', article.id);
        results.push({ id: article.id, status: 'failed', error: message });
      }
    }

    const published = results.filter(r => r.status === 'published').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const filtered = results.filter(r => r.status === 'filtered').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;

    return NextResponse.json({
      success: true,
      stats: { processed: results.length, published, failed, filtered, duplicates },
      results,
    });
  } catch (error) {
    console.error('Error in batch rewrite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
