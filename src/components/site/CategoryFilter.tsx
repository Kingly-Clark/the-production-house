'use client';

import Link from 'next/link';
import type { Category } from '@/types/database';
import { useSearchParams } from 'next/navigation';

interface CategoryFilterProps {
  categories: Category[];
  siteSlug: string;
  currentCategory?: string;
}

export default function CategoryFilter({
  categories,
  siteSlug,
  currentCategory,
}: CategoryFilterProps) {
  const searchParams = useSearchParams();

  return (
    <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
      <Link
        href={`/s/${siteSlug}`}
        className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
          !currentCategory
            ? 'bg-[var(--accent)] text-white'
            : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/s/${siteSlug}/category/${category.slug}`}
          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            currentCategory === category.slug
              ? 'bg-[var(--accent)] text-white'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
