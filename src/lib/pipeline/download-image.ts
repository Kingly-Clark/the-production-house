import { createAdminClient } from '@/lib/supabase/admin';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

async function downloadImageWithTimeout(
  imageUrl: string,
  timeoutMs: number = 10000
): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductionHouse/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error(`Image size ${buffer.byteLength} exceeds maximum ${MAX_IMAGE_SIZE}`);
    }

    return Buffer.from(buffer);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getImageExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(\w+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    // Invalid URL
  }
  return 'jpg'; // Default fallback
}

export async function downloadAndStoreImage(
  imageUrl: string,
  siteId: string,
  articleId: string
): Promise<string | null> {
  try {
    // Download the image
    const imageBuffer = await downloadImageWithTimeout(imageUrl, 10000);

    // Get extension
    const extension = getImageExtensionFromUrl(imageUrl);
    const filename = `${articleId}.${extension}`;
    const filepath = `${siteId}/${articleId}/${filename}`;

    // Upload to Supabase Storage
    const supabase = createAdminClient();

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filepath, imageBuffer, {
        contentType: `image/${extension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading image to storage: ${uploadError.message}`);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('article-images').getPublicUrl(filepath);

    return data?.publicUrl || null;
  } catch (error) {
    console.error(
      `Error downloading and storing image ${imageUrl}: ${error instanceof Error ? error.message : String(error)}`
    );
    // Return null gracefully - don't block article processing
    return null;
  }
}
