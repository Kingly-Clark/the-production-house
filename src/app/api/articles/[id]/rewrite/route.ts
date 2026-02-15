import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractArticleContent } from '@/lib/pipeline/extract-content';
import { rewriteArticle } from '@/lib/ai/gemini';
import { filterContent } from '@/lib/pipeline/filter';
import { computeSimHash, isDuplicate } from '@/lib/pipeline/simhash';
import { downloadAndStoreImage } from '@/lib/pipeline/download-image';
import { insertBacklink } from '@/lib/pipeline/backlink';
import { generateSocialCopy } from '@/lib/pipeline/social-copy';
import { categorizeArticle } from '@/lib/pipeline/categorize';
import slugify from 'slugify';

export const maxDuration = 300; // 5 minute timeout

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseServer = await createClient();
    const supabaseAdmin = createAdminClient();
    const articleId = id;

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get article and verify access
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('*, sites(organization_id)')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const { data: userOrgs } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userOrgs || userOrgs.organization_id !== (article as any).sites?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get site details
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', article.site_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get organization brand summary
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('brand_summary')
      .eq('id', site.organization_id)
      .single();

    const brandSummary = org?.brand_summary || null;

    // Extract full content if needed
    let extractedContent = article.original_content;
    if (!extractedContent && article.original_url) {
      const extracted = await extractArticleContent(article.original_url);
      extractedContent = extracted.content;
    }

    // Check for sales/promo content
    const filterResult = await filterContent(article.original_title, extractedContent || '');
    if (filterResult.shouldFilter) {
      await supabaseAdmin.from('articles').update({ status: 'filtered' }).eq('id', article.id);

      return NextResponse.json({
        success: true,
        status: 'filtered',
        reason: filterResult.reason,
      });
    }

    // Compute SimHash for duplicate detection
    const contentHash = computeSimHash(extractedContent || article.original_title);

    // Check for duplicate content
    const { data: similarArticles } = await supabaseAdmin
      .from('articles')
      .select('id, content_hash, similarity_score')
      .eq('site_id', article.site_id)
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
      await supabaseAdmin.from('articles').update({ status: 'duplicate' }).eq('id', article.id);

      return NextResponse.json({
        success: true,
        status: 'duplicate',
      });
    }

    // Rewrite article with Gemini
    const rewrittenArticle = await rewriteArticle({
      title: article.original_title,
      content: extractedContent || '',
      tone: site.tone_of_voice,
      brandSummary,
    });

    // Auto-categorize
    const categoryId = await categorizeArticle(
      rewrittenArticle.title,
      rewrittenArticle.content,
      article.site_id,
      supabaseAdmin
    );

    // Generate social copy
    const socialResult = await generateSocialCopy(
      {
        ...article,
        title: rewrittenArticle.title,
        excerpt: rewrittenArticle.excerpt,
        content: rewrittenArticle.content,
      },
      ['linkedin', 'facebook', 'x', 'instagram']
    );

    // Download and store featured image
    let storedImageUrl: string | null = null;
    if (article.featured_image_url) {
      storedImageUrl = await downloadAndStoreImage(article.featured_image_url, article.site_id, article.id);
    }

    // Get backlink settings
    const { data: backlinkSettings } = await supabaseAdmin
      .from('backlink_settings')
      .select('*')
      .eq('site_id', article.site_id)
      .single();

    // Insert backlink if enabled
    let contentWithBacklink = rewrittenArticle.content;
    let hasBacklink = false;
    if (backlinkSettings && backlinkSettings.is_enabled) {
      const backlink = insertBacklink(rewrittenArticle.content, backlinkSettings, 0);
      contentWithBacklink = backlink.modifiedContent;
      hasBacklink = backlink.inserted;
    }

    // Generate slug
    const slug = slugify(rewrittenArticle.title, { lower: true, strict: true });

    // Update article with rewritten content
    const { error: updateError } = await supabaseAdmin.from('articles').update({
      title: rewrittenArticle.title,
      slug,
      content: contentWithBacklink,
      excerpt: rewrittenArticle.excerpt,
      meta_description: rewrittenArticle.metaDescription,
      tags: rewrittenArticle.tags,
      category_id: categoryId,
      featured_image_url: article.featured_image_url,
      featured_image_stored: storedImageUrl,
      status: 'published',
      published_at: new Date().toISOString(),
      social_copy: socialResult.copy,
      social_hashtags: socialResult.hashtags,
      has_backlink: hasBacklink,
      content_hash: contentHash,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      throw new Error(`Error updating article: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      status: 'published',
      article: {
        id: article.id,
        title: rewrittenArticle.title,
        slug,
      },
    });
  } catch (error) {
    console.error('Error rewriting article:', error);

    // Mark article as failed
    try {
      const { id: articleId } = await params;
      await createAdminClient()
        .from('articles')
        .update({ status: 'failed' })
        .eq('id', articleId);
    } catch {
      // Silent catch
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
