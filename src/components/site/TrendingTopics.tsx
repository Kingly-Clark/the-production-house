import Link from 'next/link';
import type { Category } from '@/types/database';

interface TrendingTopicsProps {
  categories: Category[];
  siteSlug: string;
}

export default function TrendingTopics({ categories, siteSlug }: TrendingTopicsProps) {
  const sorted = [...categories]
    .sort((a, b) => b.article_count - a.article_count)
    .slice(0, 8);

  if (sorted.length === 0) return null;

  return (
    <aside className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="font-bold text-lg text-white mb-4">Trending Topics</h3>
      <ul className="space-y-2">
        {sorted.map((category) => (
          <li key={category.id}>
            <Link
              href={`/s/${siteSlug}/category/${category.slug}`}
              className="flex items-center justify-between group text-sm text-gray-300 hover:text-white transition-colors"
            >
              <span className="group-hover:underline">{category.name}</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {category.article_count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
