import { createAdminClient } from '@/lib/supabase/admin';
import sharp from 'sharp';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1200; // Max width for resized images
const WEBP_QUALITY = 80; // Good balance of quality and file size

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

export async function downloadAndStoreImage(
  imageUrl: string,
  siteId: string,
  articleId: string
): Promise<string | null> {
  try {
    // Download the image
    const imageBuffer = await downloadImageWithTimeout(imageUrl, 10000);

    // Compress and convert to WebP using sharp
    // - Resize to max width (maintains aspect ratio)
    // - Convert to WebP for better compression
    // - Quality 80 is a good balance
    const compressedBuffer = await sharp(imageBuffer)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Always use .webp extension for compressed images
    const filename = `${articleId}.webp`;
    const filepath = `${siteId}/${articleId}/${filename}`;

    // Upload to Supabase Storage
    const supabase = createAdminClient();

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filepath, compressedBuffer, {
        contentType: 'image/webp',
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
