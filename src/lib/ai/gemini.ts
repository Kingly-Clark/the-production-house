import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    // Accept either env var name for flexibility
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Google AI API key is required. Set GOOGLE_AI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.'
      );
    }
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

const client = new Proxy({} as GoogleGenerativeAI, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});

interface RewriteInput {
  title: string;
  content: string;
  tone: string;
  brandSummary: string | null;
}

interface RewriteOutput {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  category: string;
  socialCopy: string;
  socialHashtags: string[];
}

interface SocialCopyOutput {
  copy: string;
  hashtags: string[];
}

interface FilterOutput {
  isSales: boolean;
  confidence: number;
}

// Retry helper for rate-limited API calls
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes('429') ||
         error.message.includes('Too Many Requests') ||
         error.message.includes('RESOURCE_EXHAUSTED'));

      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 5s, 15s, 45s
        const waitMs = 5000 * Math.pow(3, attempt);
        console.log(`Rate limited, retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function rewriteArticle(input: RewriteInput): Promise<RewriteOutput> {
  const { title, content, tone, brandSummary } = input;

  // Single combined prompt — rewrite + category + social copy in one API call
  const systemPrompt = `You are an expert content rewriter for a content syndication platform. Your task is to rewrite syndicated articles with unique voice and high SEO value, AND generate social media copy.

CRITICAL REQUIREMENTS:
1. Rewrite the article in a completely unique voice - do not paraphrase the original
2. Match the tone of voice: "${tone}"
3. Incorporate this brand context where relevant: ${brandSummary || 'No specific brand context provided'}
4. Create an SEO-friendly title with relevant keywords
5. Write a concise excerpt (2-3 sentences) that hooks readers
6. Generate a meta description (150-160 characters) optimized for search
7. Identify 5-7 relevant tags
8. Suggest a primary category name
9. Generate a short social media post (under 200 chars) promoting this article
10. Generate 5-8 relevant hashtags for social media

The rewritten content must:
- Be original and provide unique perspective
- Maintain factual accuracy
- Be formatted for web readability with short paragraphs using HTML tags`;

  const userPrompt = `Rewrite this article and generate social media copy:

TITLE: ${title}

CONTENT:
${content.substring(0, 8000)}

Return your response as valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "SEO-optimized rewritten title",
  "content": "Full rewritten article content in HTML (use <p>, <h2>, <h3>, <ul>, <li> tags)",
  "excerpt": "2-3 sentence excerpt",
  "metaDescription": "150-160 character meta description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "Primary category name",
  "socialCopy": "Short engaging social media post under 200 characters",
  "socialHashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error('No response text from Gemini');
    }

    // Clean potential markdown wrapping
    const cleaned = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || title,
      content: parsed.content || content,
      excerpt: parsed.excerpt || content.substring(0, 200),
      metaDescription: parsed.metaDescription || '',
      tags: parsed.tags || [],
      category: parsed.category || 'Uncategorized',
      socialCopy: parsed.socialCopy || parsed.title || title,
      socialHashtags: parsed.socialHashtags || [],
    };
  });
}

export async function generateSocialCopy(
  article: { title: string; excerpt: string },
  platform: string
): Promise<SocialCopyOutput> {
  const systemPrompt = `You are a social media copywriting expert. Generate engaging, platform-appropriate copy for syndicated content.

Guidelines by platform:
- LinkedIn: Professional tone, 150-200 characters, mention industry relevance
- Facebook: Engaging and conversational, 100-150 characters, use emojis sparingly
- X/Twitter: Punchy and concise, must be under 280 characters
- Instagram: Hashtag-heavy, 150 characters + 10 relevant hashtags
- TikTok: Trendy and casual, 100 characters, use current slang`;

  const userPrompt = `Generate social media copy for ${platform} for this article:

TITLE: ${article.title}
EXCERPT: ${article.excerpt}

Return valid JSON with this structure:
{
  "copy": "The social media copy text",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error('No response text from Gemini');
    }

    const parsed = JSON.parse(responseText);
    return {
      copy: parsed.copy || article.title,
      hashtags: parsed.hashtags || [],
    };
  } catch (error) {
    console.error('Error generating social copy with Gemini:', error);
    throw error;
  }
}

export async function categorizeArticle(
  title: string,
  content: string,
  existingCategories: string[]
): Promise<string> {
  const systemPrompt = `You are a content categorization expert. Analyze articles and assign them to appropriate categories.

Existing categories available: ${existingCategories.join(', ') || 'None yet'}

Your task:
1. Analyze the article content
2. Choose the best existing category if it's a good fit
3. If no existing category is appropriate, suggest a new category name
4. Return ONLY the category name, nothing else`;

  const userPrompt = `Categorize this article:

TITLE: ${title}

CONTENT: ${content.substring(0, 1000)}...

Return ONLY the category name as plain text.`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = response.response.text() || 'Uncategorized';
    return responseText.trim();
  } catch (error) {
    console.error('Error categorizing article with Gemini:', error);
    return 'Uncategorized';
  }
}

export async function filterSalesContent(
  title: string,
  content: string
): Promise<FilterOutput> {
  const systemPrompt = `You are an expert at identifying sales and promotional content. Analyze articles and determine if they are primarily sales/promotional material.

Sales/promotional indicators:
- Direct calls to action ("Buy now", "Shop today", "Order now")
- Heavy discounting language ("Limited time", "Only $X", "Save 50%")
- Excessive product promotion and linking
- Landing page style content
- Affiliate marketing language

Return a JSON response with isSales (boolean) and confidence (0-1 decimal).`;

  const userPrompt = `Analyze this content for sales/promotional nature:

TITLE: ${title}

CONTENT: ${content.substring(0, 1500)}

Return valid JSON:
{
  "isSales": boolean,
  "confidence": decimal between 0 and 1
}`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = response.response.text();
    if (!responseText) {
      return { isSales: false, confidence: 0 };
    }

    const parsed = JSON.parse(responseText);
    return {
      isSales: parsed.isSales || false,
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error('Error filtering sales content with Gemini:', error);
    return { isSales: false, confidence: 0 };
  }
}
