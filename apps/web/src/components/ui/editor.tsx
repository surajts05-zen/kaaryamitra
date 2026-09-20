import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({ value, onChange, placeholder, editable = true }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px]',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={`border rounded-md bg-background ${!editable ? 'opacity-70' : ''}`}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('heading', { level: 3 }) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('orderedList') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded hover:bg-accent ${editor.isActive('taskList') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="p-4 cursor-text" onClick={() => editable && editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
