import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Category } from '@/types/database';
import { categorizeArticle as categorizeWithGemini } from '@/lib/ai/gemini';
import slugify from 'slugify';

export async function categorizeArticle(
  title: string,
  content: string,
  siteId: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  try {
    // Get existing categories for this site
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('name')
      .eq('site_id', siteId);

    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return 'Uncategorized';
    }

    const categoryNames = (existingCategories || []).map((c) => c.name);

    // Use Gemini to determine category
    const suggestedCategory = await categorizeWithGemini(title, content, categoryNames);

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('site_id', siteId)
      .eq('name', suggestedCategory)
      .single();

    // If category exists, return its ID
    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category
    const slug = slugify(suggestedCategory, { lower: true, strict: true });

    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        site_id: siteId,
        name: suggestedCategory,
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
