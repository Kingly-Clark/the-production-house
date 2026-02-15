import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import slugify from 'slugify';

/**
 * Resolves a category name to a category ID.
 * Uses the category name from the rewrite response (no extra Gemini call).
 * Creates the category if it doesn't exist.
 */
export async function categorizeArticle(
  title: string,
  content: string,
  siteId: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  try {
    // The category name comes from the rewrite response.
    // We use the title-derived heuristic as a simple fallback
    // (the actual category is set by the caller from rewrittenArticle.category)
    const categoryName = content || 'Uncategorized';

    // Check if category already exists for this site
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('site_id', siteId)
      .eq('name', categoryName)
      .single();

    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category
    const slug = slugify(categoryName, { lower: true, strict: true });

    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        site_id: siteId,
        name: categoryName,
        slug,
        article_count: 0,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating category:', createError);
      return 'Uncategorized';
    }

    return newCategory?.id || 'Uncategorized';
  } catch (error) {
    console.error('Error categorizing article:', error);
    return 'Uncategorized';
  }
}
