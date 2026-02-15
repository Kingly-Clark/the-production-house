import type { Article } from '@/types/database';
import ArticleCard from './ArticleCard';

interface LatestStoriesProps {
  articles: Article[];
  siteSlug: string;
}

export default function LatestStories({ articles, siteSlug }: LatestStoriesProps) {
  const latest = articles.slice(0, 5);

  if (latest.length === 0) return null;

  return (
    <aside className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Latest Stories</h3>
      <div className="space-y-4">
        {latest.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            slug={siteSlug}
            variant="compact"
          />
        ))}
      </div>
    </aside>
  );
}
