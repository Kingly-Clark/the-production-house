'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Quote,
  Undo,
  Redo,
  Code,
  Minus,
} from 'lucide-react';

interface ArticleEditorProps {
  initialTitle: string;
  initialContent: string;
  initialExcerpt: string;
  initialTags: string[];
  initialMetaDescription: string;
  onSave: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    meta_description: string;
  }) => Promise<void>;
  saving: boolean;
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

export function ArticleEditor({
  initialTitle,
  initialContent,
  initialExcerpt,
  initialTags,
  initialMetaDescription,
  onSave,
  saving,
}: ArticleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tagsStr, setTagsStr] = useState(initialTags.join(', '));
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-400 underline' },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'article-content min-h-[400px] focus:outline-none p-4',
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await onSave({
      title,
      content: editor.getHTML(),
      excerpt,
      tags,
      meta_description: metaDescription,
    });
  };

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-slate-300 mb-2 block">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white text-xl font-bold"
          placeholder="Article title"
        />
      </div>

      {/* Editor Toolbar */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-700 bg-slate-850">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt" className="text-slate-300 mb-2 block">
          Excerpt
        </Label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Brief summary of the article..."
        />
      </div>

      {/* Meta Description */}
      <div>
        <Label htmlFor="meta" className="text-slate-300 mb-2 block">
          Meta Description
          <span className="text-slate-500 font-normal ml-2">
            ({metaDescription.length}/160)
          </span>
        </Label>
        <textarea
          id="meta"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          maxLength={160}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="SEO meta description (150-160 characters)"
        />
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags" className="text-slate-300 mb-2 block">
          Tags
          <span className="text-slate-500 font-normal ml-2">(comma separated)</span>
        </Label>
        <Input
          id="tags"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white"
          placeholder="e.g. AI, technology, security"
        />
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
