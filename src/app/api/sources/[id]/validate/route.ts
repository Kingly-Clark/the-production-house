import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify access
    const { data: source, error: fetchError } = await supabase
      .from('sources')
      .select('site_id, url, source_type')
      .eq('id', id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', source.site_id)
      .single();

    if (siteError || !site || site.organization_id !== user.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate the source URL
    let isValid = false;

    try {
      const response = await fetch(source.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ProductionHouse/1.0 (+http://productionhouse.app)',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';

        if (source.source_type === 'rss') {
          // Check if it's XML/RSS
          isValid =
            contentType.includes('xml') ||
            contentType.includes('rss') ||
            contentType.includes('atom');

          if (!isValid) {
            const text = await response.text();
            isValid =
              text.includes('<rss') ||
              text.includes('<feed') ||
              text.includes('<?xml');
          }
        } else if (source.source_type === 'sitemap') {
          // Check if it's XML/Sitemap
          isValid = contentType.includes('xml');

          if (!isValid) {
            const text = await response.text();
            isValid = text.includes('<?xml') && text.includes('<url');
          }
        }
      }
    } catch (err) {
      // Validation failed
      isValid = false;
    }

    // Update source validation status
    const { data: updated, error } = await supabase
      .from('sources')
      .update({
        is_validated: isValid,
        last_error: isValid ? null : 'Validation failed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating source:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
