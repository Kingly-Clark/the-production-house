import { filterSalesContent } from '@/lib/ai/gemini';

const SALES_KEYWORDS = [
  'buy now',
  'buy online',
  'shop now',
  'limited time',
  'discount',
  'promo',
  'sale',
  'coupon',
  'deal',
  'offer',
  'special price',
  'exclusive deal',
  'free shipping',
  'order now',
  'add to cart',
  'checkout',
  'get yours',
  'claim yours',
  'save now',
  'limited stock',
];

const PRICE_PATTERNS = [/\$\s*\d+/, /€\s*\d+/, /£\s*\d+/, /\d+\s*€/, /\d+\s*£/];

function countUppercaseWords(text: string): { uppercase: number; total: number } {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  let uppercaseCount = 0;

  for (const word of words) {
    // Check if word is mostly uppercase letters
    const letters = word.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0 && letters === letters.toUpperCase()) {
      uppercaseCount++;
    }
  }

  return {
    uppercase: uppercaseCount,
    total: words.length,
  };
}

function countLinks(content: string): number {
  const linkPattern = /<a\s+href/gi;
  const matches = content.match(linkPattern);
  return matches ? matches.length : 0;
}

function containsSalesKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  for (const keyword of SALES_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function containsPriceMentions(text: string): boolean {
  for (const pattern of PRICE_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

export interface FilterResult {
  shouldFilter: boolean;
  reason: string;
}

export async function filterContent(title: string, content: string): Promise<FilterResult> {
  const textToAnalyze = `${title} ${content}`;

  // Check for obvious sales indicators
  if (containsSalesKeywords(textToAnalyze)) {
    return {
      shouldFilter: true,
      reason: 'Contains sales keywords',
    };
  }

  // Check for excessive uppercase
  const { uppercase, total } = countUppercaseWords(textToAnalyze);
  if (total > 0 && uppercase / total > 0.3) {
    return {
      shouldFilter: true,
      reason: 'Excessive uppercase text (>30%)',
    };
  }

  // Check for too many links
  const linkCount = countLinks(content);
  if (linkCount > 10) {
    return {
      shouldFilter: true,
      reason: 'Too many links in content (>10)',
    };
  }

  // Check for price mentions
  if (containsPriceMentions(textToAnalyze)) {
    // This is borderline - ask Gemini for final determination
    try {
      const geminResult = await filterSalesContent(title, content);
      if (geminResult.isSales && geminResult.confidence > 0.6) {
        return {
          shouldFilter: true,
          reason: 'Detected as sales content by AI (price mentions)',
        };
      }
    } catch (error) {
      console.error('Error checking with Gemini:', error);
      // Don't filter on borderline cases if Gemini fails
    }
  }

  // For borderline cases, ask Gemini
  try {
    const geminResult = await filterSalesContent(title, content);
    if (geminResult.isSales && geminResult.confidence > 0.75) {
      return {
        shouldFilter: true,
        reason: 'Detected as sales content by AI',
      };
    }
  } catch (error) {
    console.error('Error checking with Gemini:', error);
    // Default to allowing content if AI check fails
  }

  return {
    shouldFilter: false,
    reason: '',
  };
}
