import { scrapeWebsite } from '@/lib/scraper';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: unknown };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const scrapedData = await scrapeWebsite(url);

    return NextResponse.json(scrapedData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('timeout') || message.includes('Timeout')) {
      return NextResponse.json(
        { error: 'Request timeout. The website took too long to respond.' },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
