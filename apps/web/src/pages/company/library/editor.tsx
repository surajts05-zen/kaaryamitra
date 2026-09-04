import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2,
  List, ListOrdered, Quote, Undo, Redo, Save
} from 'lucide-react';
import {
  useCreateArticle,
  useUpdateItem,
  useLibraryItems,
  LibraryItemType
} from '@/features/library/hooks/use-library-queries';
import { toast } from 'sonner';

export function LibraryEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folderId') || null;
  const navigate = useNavigate();

  // If we have an ID, we'd normally fetch the item. 
  // For simplicity here, we'll just use useLibraryItems and find it (though a single query is better).
  // In a real app, create a useLibraryItem(id) query.
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LibraryItemType>(LibraryItemType.ARTICLE);
  const [isPinned, setIsPinned] = useState(false);
  const [content, setContent] = useState('');

  const create = useCreateArticle();
  const update = useUpdateItem();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your amazing article...' }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (id) {
        await update.mutateAsync({
          id,
          data: { title, content, type, isPinned },
        });
        toast.success('Article updated successfully');
      } else {
        await create.mutateAsync({
          title,
          content,
          type,
          isPinned,
          folderId,
        });
        toast.success('Article published successfully');
      }
      navigate('../library'); // Go back to library
    } catch (error) {
      toast.error('Failed to save article');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: 'Content Library', path: '../library' },
            { label: id ? 'Edit Article' : 'New Article' },
          ]}
        />
        <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {id ? 'Save Changes' : 'Publish'}
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <Label>Title</Label>
            <Input 
              placeholder="Article Title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="text-lg font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(val) => setType(val as LibraryItemType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LibraryItemType.ARTICLE}>Standard Article</SelectItem>
                <SelectItem value={LibraryItemType.ANNOUNCEMENT}>Announcement / News</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === LibraryItemType.ANNOUNCEMENT && (
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md border">
            <div>
              <p className="font-medium text-sm">Pin to Dashboard</p>
              <p className="text-xs text-muted-foreground">Pinned announcements appear prominently on the Home Landing Page.</p>
            </div>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>
        )}

        <div className="border rounded-md overflow-hidden flex flex-col">
          {/* Toolbar */}
          {editor && (
            <div className="bg-muted p-2 flex flex-wrap gap-1 border-b">
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted-foreground/20' : ''}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted-foreground/20' : ''}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-muted-foreground/20' : ''}>
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'bg-muted-foreground/20' : ''}>
                <Code className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-1 self-center" />
              
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-muted-foreground/20' : ''}>
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-muted-foreground/20' : ''}>
                <Heading2 className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-1 self-center" />
              
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-muted-foreground/20' : ''}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-muted-foreground/20' : ''}>
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-muted-foreground/20' : ''}>
                <Quote className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-1 self-center" />
              
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Editor Content */}
          <div className="p-4 min-h-[400px] prose prose-sm dark:prose-invert max-w-none focus:outline-none">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryEditorPage;
