import { summarizeWebsite } from '@/lib/ai/summarize';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title, description } = body as {
      url?: unknown;
      title?: unknown;
      description?: unknown;
    };

    // Validate inputs
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    const summary = await summarizeWebsite({
      url,
      title,
      description,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('API key') || message.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
