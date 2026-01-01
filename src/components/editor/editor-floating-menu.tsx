
import { FloatingMenu, type Editor } from '@tiptap/react';
import { 
  Plus, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, // Not used but convention
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface EditorFloatingMenuProps {
  editor: Editor;
}


export const EditorFloatingMenu = ({ editor }: EditorFloatingMenuProps) => {
  return (
    <FloatingMenu 
        editor={editor} 
        tippyOptions={{ duration: 100 }}
        className="flex items-center gap-1"
    >
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted foreground">
                <Plus className="h-4 w-4" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" side="right" className="flex flex-col gap-1 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <List className="h-4 w-4 mr-2" />
                Bullet List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <ListOrdered className="h-4 w-4 mr-2" />
                Ordered List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className="justify-start h-8 px-2 w-full font-medium"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Task List
              </Button>
         </DropdownMenuContent>
       </DropdownMenu>
    </FloatingMenu>
  );
};
