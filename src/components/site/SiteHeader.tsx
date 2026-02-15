import Link from 'next/link';
import Image from 'next/image';
import type { Site, SiteSettings, Category } from '@/types/database';

interface SiteHeaderProps {
  site: Site;
  settings: SiteSettings;
  categories: Category[];
}

export default function SiteHeader({ site, settings }: SiteHeaderProps) {
  return (
    <header className="bg-[var(--bg)] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href={`/s/${site.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {settings.logo_url ? (
              <div className="relative w-10 h-10">
                <Image
                  src={settings.logo_url}
                  alt={site.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {site.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">{site.name}</h1>
              {site.header_text && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{site.header_text}</p>
              )}
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href={`/s/${site.slug}`}
              className="text-[var(--text)] hover:text-[var(--accent)] transition-colors font-medium text-sm"
            >
              Home
            </Link>
            <Link
              href={`/s/${site.slug}/topics`}
              className="text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors text-sm"
            >
              Topics
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
