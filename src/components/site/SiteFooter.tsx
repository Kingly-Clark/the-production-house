import Link from 'next/link';
import type { Site } from '@/types/database';

interface SiteFooterProps {
  site: Site;
}

export default function SiteFooter({ site }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg)] border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Site Info */}
          <div>
            <h3 className="font-bold text-[var(--text)] mb-2">{site.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {site.description || 'Curated content delivered daily.'}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-[var(--text)] text-sm mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/s/${site.slug}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <a
                  href={`/s/${site.slug}/feed.xml`}
                  className="text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors"
                >
                  RSS Feed
                </a>
              </li>
              <li>
                <a
                  href={`/s/${site.slug}/sitemap.xml`}
                  className="text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] transition-colors"
                >
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Meta */}
          <div>
            <h4 className="font-semibold text-[var(--text)] text-sm mb-4">About</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Content syndicated and managed by{' '}
              <a
                href={process.env.NEXT_PUBLIC_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Production House
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <p>© {currentYear} {site.name}. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-[var(--accent)] transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-[var(--accent)] transition-colors">
                Terms
              </a>
              <a
                href="https://productionhouse.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent)] transition-colors"
              >
                Powered by Production House
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
