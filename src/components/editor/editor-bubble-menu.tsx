import { BubbleMenu, type Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code 
} from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Toggle } from '@/components/ui/toggle'; // Assuming ShadCN toggle or button
import { Button } from '@/components/ui/button';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 p-1 rounded-md border bg-popover shadow-md"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted text-muted-foreground")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
         className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted text-muted-foreground")}
      >
        <Italic className="h-4 w-4" />
      </Button>
       <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
         className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-muted text-muted-foreground")}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
         className={cn("h-8 w-8 p-0", editor.isActive('strike') && "bg-muted text-muted-foreground")}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
       <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
         className={cn("h-8 w-8 p-0", editor.isActive('code') && "bg-muted text-muted-foreground")}
      >
        <Code className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
};
