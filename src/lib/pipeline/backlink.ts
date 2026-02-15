import { BacklinkSettings } from '@/types/database';

export interface BacklinkInsertResult {
  modifiedContent: string;
  inserted: boolean;
}

export function insertBacklink(
  content: string,
  settings: BacklinkSettings,
  articleIndex: number
): BacklinkInsertResult {
  // Check frequency - only insert if article index matches frequency
  if (articleIndex % settings.frequency !== 0) {
    return {
      modifiedContent: content,
      inserted: false,
    };
  }

  const linkText = settings.link_text || 'Learn More';
  const targetUrl = settings.target_url || '#';
  const bannerText = settings.banner_text || 'Check out our latest content';
  const bannerImageUrl = settings.banner_image_url;

  let modifiedContent = content;

  if (settings.placement_type === 'inline' || settings.placement_type === 'both') {
    // Find a natural paragraph break to insert the link
    // Look for closing </p> tags
    const paragraphs = modifiedContent.split('</p>');

    if (paragraphs.length > 1) {
      // Insert after a natural breaking point (roughly 60% through content)
      const insertIndex = Math.floor(paragraphs.length * 0.6);

      // Create contextual link element
      const contextLink = `<p><a href="${escapeHtml(targetUrl)}" style="color: #0066cc; text-decoration: underline; font-weight: 500;">${escapeHtml(linkText)}</a></p>`;

      // Reconstruct with inserted link
      const newParagraphs = [...paragraphs];
      newParagraphs.splice(insertIndex, 0, contextLink);
      modifiedContent = newParagraphs.join('</p>');
    }
  }

  if (settings.placement_type === 'banner' || settings.placement_type === 'both') {
    // Append banner at the end
    const banner = generateBannerHtml(bannerText, bannerImageUrl, targetUrl, linkText);
    modifiedContent = modifiedContent + banner;
  }

  return {
    modifiedContent,
    inserted: true,
  };
}

function generateBannerHtml(
  text: string,
  imageUrl: string | null,
  targetUrl: string,
  linkText: string
): string {
  const bannerStyle = `
    display: flex;
    align-items: center;
    gap: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 8px;
    margin: 40px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Banner" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />`
    : '';

  const contentStyle = `
    flex: 1;
  `;

  const buttonStyle = `
    display: inline-block;
    background: white;
    color: #667eea;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 12px;
    transition: transform 0.2s;
  `;

  return `
<div style="${bannerStyle}">
  ${imageHtml}
  <div style="${contentStyle}">
    <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">${escapeHtml(text)}</p>
    <a href="${escapeHtml(targetUrl)}" style="${buttonStyle}">${escapeHtml(linkText)}</a>
  </div>
</div>
  `;
}

function escapeHtml(text: string): string {
  const escapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}
