import Link from 'next/link';
import Image from 'next/image';
import type { Site, SiteSettings, Category } from '@/types/database';

interface SiteHeaderProps {
  site: Site;
  settings: SiteSettings;
  categories: Category[];
}

export default function SiteHeader({ site, settings, categories }: SiteHeaderProps) {
  const topCategories = categories.slice(0, 5);

  return (
    <header className="bg-[var(--bg)] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
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

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/s/${site.slug}`}
              className="text-[var(--text)] hover:text-[var(--accent)] transition-colors font-medium text-sm"
            >
              Home
            </Link>
            {topCategories.length > 0 && (
              <div className="flex items-center gap-4">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/s/${site.slug}/category/${cat.slug}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Mobile Category Bar */}
        {topCategories.length > 0 && (
          <div className="md:hidden flex overflow-x-auto gap-3 pb-3 -mx-4 px-4 scrollbar-hide">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/s/${site.slug}/category/${cat.slug}`}
                className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors whitespace-nowrap flex-shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
