import { Article } from '@/types/database';
import { generateSocialCopy as generateWithGemini } from '@/lib/ai/gemini';

export interface SocialCopyResult {
  copy: string;
  hashtags: string[];
}

const platformConfigs = {
  linkedin: {
    maxChars: 200,
    tone: 'professional, industry-focused, thought leadership',
  },
  facebook: {
    maxChars: 150,
    tone: 'engaging, conversational, community-focused',
  },
  x: {
    maxChars: 280,
    tone: 'punchy, witty, concise',
  },
  instagram: {
    maxChars: 150,
    tone: 'visual-first, hashtag-heavy, trendy',
  },
  tiktok: {
    maxChars: 100,
    tone: 'casual, trendy, Gen-Z friendly',
  },
};

async function generateForPlatform(
  article: Article,
  platform: string
): Promise<SocialCopyResult> {
  try {
    // Get platform config
    const config = platformConfigs[platform as keyof typeof platformConfigs];
    if (!config) {
      console.warn(`Unknown platform: ${platform}`);
      return {
        copy: article.title || 'Check out our latest article',
        hashtags: [],
      };
    }

    // Generate with Gemini
    const result = await generateWithGemini(
      {
        title: article.title || '',
        excerpt: article.excerpt || '',
      },
      platform
    );

    return {
      copy: result.copy.substring(0, config.maxChars),
      hashtags: result.hashtags.slice(0, 10),
    };
  } catch (error) {
    console.error(`Error generating social copy for ${platform}:`, error);

    // Fallback: return basic copy
    return {
      copy: article.title || 'Check out our latest article',
      hashtags: ['contentmarketing', 'readsmore'],
    };
  }
}

export async function generateSocialCopy(
  article: Article,
  platforms: string[]
): Promise<SocialCopyResult> {
  if (!article.excerpt && !article.content) {
    return {
      copy: article.title || '',
      hashtags: [],
    };
  }

  // Generate copies for all platforms
  const copies: SocialCopyResult[] = [];
  let allHashtags = new Set<string>();

  for (const platform of platforms) {
    try {
      const result = await generateForPlatform(article, platform);
      copies.push(result);
      result.hashtags.forEach((tag) => allHashtags.add(tag));
    } catch (error) {
      console.error(`Failed to generate copy for ${platform}:`, error);
    }
  }

  if (copies.length === 0) {
    // Fallback if all generations failed
    return {
      copy: article.title || 'Check out our latest article',
      hashtags: [],
    };
  }

  // Use the first generated copy as the main one
  const mainCopy = copies[0];

  return {
    copy: mainCopy.copy,
    hashtags: Array.from(allHashtags),
  };
}
