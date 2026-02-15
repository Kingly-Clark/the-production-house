// Content filter — only blocks obvious spam/landing pages, not normal articles.
// Intentionally lenient: the platform's purpose is to syndicate and rewrite content,
// so we only filter content that is purely a sales landing page or spam.

// These are aggressive CTA phrases that indicate a landing page, not an article
const LANDING_PAGE_PHRASES = [
  'add to cart',
  'buy now',
  'buy online',
  'shop now',
  'order now',
  'checkout now',
  'get yours today',
  'claim yours now',
  'limited stock remaining',
];

export interface FilterResult {
  shouldFilter: boolean;
  reason: string;
}

export async function filterContent(title: string, content: string): Promise<FilterResult> {
  // Only filter if the content is extremely short (likely a landing page stub)
  // or contains multiple aggressive sales CTAs
  const textToAnalyze = `${title} ${content}`.toLowerCase();

  // Count how many aggressive landing-page phrases appear
  let ctaCount = 0;
  for (const phrase of LANDING_PAGE_PHRASES) {
    if (textToAnalyze.includes(phrase)) {
      ctaCount++;
    }
  }

  // Only filter if 3+ aggressive CTAs found — this is almost certainly a product page
  if (ctaCount >= 3) {
    return {
      shouldFilter: true,
      reason: `Contains ${ctaCount} sales call-to-action phrases (likely a product page)`,
    };
  }

  // Filter if content is nearly empty (< 50 chars excluding title)
  if (content.trim().length < 50) {
    return {
      shouldFilter: true,
      reason: 'Content too short to rewrite',
    };
  }

  // Allow everything else — the rewriter will handle normal articles
  return {
    shouldFilter: false,
    reason: '',
  };
}
