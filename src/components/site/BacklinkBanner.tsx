import Link from 'next/link';
import Image from 'next/image';
import type { BacklinkSettings } from '@/types/database';

interface BacklinkBannerProps {
  settings: BacklinkSettings;
}

export default function BacklinkBanner({ settings }: BacklinkBannerProps) {
  if (!settings.is_enabled || !settings.target_url) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-lg p-6 mb-8 text-white">
      <div className="flex gap-4 items-center">
        {settings.banner_image_url && (
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={settings.banner_image_url}
              alt="Banner"
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          {settings.banner_text && (
            <p className="text-sm mb-2 opacity-90">{settings.banner_text}</p>
          )}
          <Link
            href={settings.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-white text-[var(--primary)] font-medium rounded-lg hover:bg-opacity-90 transition-all"
          >
            {settings.link_text || 'Learn More'}
          </Link>
        </div>
      </div>
    </div>
  );
}
