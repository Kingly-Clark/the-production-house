'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Article } from '@/types/database';
import { Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleTableProps {
  articles: Article[];
  siteId: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onArticleDeleted?: (articleId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  raw: 'bg-slate-800 text-slate-200',
  pending: 'bg-yellow-900 text-yellow-200',
  rewriting: 'bg-blue-900 text-blue-200',
  published: 'bg-green-900 text-green-200',
  unpublished: 'bg-slate-700 text-slate-200',
  failed: 'bg-red-900 text-red-200',
  duplicate: 'bg-orange-900 text-orange-200',
  filtered: 'bg-slate-600 text-slate-200',
  deleted: 'bg-red-950 text-red-300',
};

export function ArticleTable({
  articles,
  siteId,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onArticleDeleted,
}: ArticleTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (articles.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800 p-12 text-center">
        <p className="text-slate-400">No articles found</p>
      </Card>
    );
  }

  const allSelected = articles.length > 0 && articles.every((a) => selectedIds.has(a.id));
  const someSelected = articles.some((a) => selectedIds.has(a.id)) && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      articles.forEach((a) => next.delete(a.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      articles.forEach((a) => next.add(a.id));
      onSelectionChange(next);
    }
  };

  const handleSelect = (articleId: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(articleId)) {
      next.delete(articleId);
    } else {
      next.add(articleId);
    }
    onSelectionChange(next);
  };

  const handleDelete = async (e: React.MouseEvent, articleId: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This will mark it as deleted and it won't be re-scraped.`)) return;

    setDeletingId(articleId);
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Article deleted');
        onArticleDeleted?.(articleId);
      } else {
        toast.error('Failed to delete article');
      }
    } catch {
      toast.error('Failed to delete article');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-800 border-b border-slate-700">
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </TableHead>
            )}
            <TableHead className="text-slate-300">Title</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Published</TableHead>
            <TableHead className="text-slate-300">Views</TableHead>
            <TableHead className="text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const isSelected = selectedIds.has(article.id);
            const articleTitle = article.title || article.original_title;

            return (
              <TableRow
                key={article.id}
                className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  isSelected ? 'bg-blue-950/30' : ''
                } ${selectable ? 'cursor-pointer' : ''}`}
                onClick={selectable ? () => handleSelect(article.id) : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelect(article.id)}
                      className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableCell>
                )}
                <TableCell className="text-white font-medium max-w-xs truncate">
                  {articleTitle}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[article.status] || 'bg-slate-700'}>
                    {article.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-4 h-4" />
                    {article.view_count}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit - show for published/unpublished/raw/failed/filtered articles */}
                    {article.status !== 'deleted' && article.status !== 'rewriting' && (
                      <Link href={`/dashboard/sites/${siteId}/articles/${article.id}/edit`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 gap-1"
                          title="Edit article"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="text-xs">Edit</span>
                        </Button>
                      </Link>
                    )}
                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-400"
                      title="Delete article"
                      disabled={deletingId === article.id}
                      onClick={(e) => handleDelete(e, article.id, articleTitle)}
                    >
                      {deletingId === article.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
