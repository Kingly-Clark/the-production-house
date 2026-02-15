'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArticleEditor } from '@/components/dashboard/ArticleEditor';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Article } from '@/types/database';
import { toast } from 'sonner';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) throw new Error('Failed to load article');
        const data = await res.json();
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleSave = async (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    meta_description: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          updated_at: new Date().toISOString(),
          // Do NOT update published_at — keep the original publish date
        }),
      });

      if (res.ok) {
        toast.success('Article saved successfully');
        router.push(`/dashboard/sites/${siteId}/articles`);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save article');
      }
    } catch {
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <Card className="bg-red-950 border-red-800 p-6 text-red-200">
        <p>Error: {error || 'Article not found'}</p>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/dashboard/sites/${siteId}/articles`}
        className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Articles
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Edit Article</h1>
        <p className="text-slate-400 mt-2">
          {article.published_at
            ? `Published on ${new Date(article.published_at).toLocaleDateString()}`
            : 'Not yet published'}
        </p>
      </div>

      <ArticleEditor
        initialTitle={article.title || article.original_title}
        initialContent={article.content || article.original_content || ''}
        initialExcerpt={article.excerpt || ''}
        initialTags={article.tags || []}
        initialMetaDescription={article.meta_description || ''}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
