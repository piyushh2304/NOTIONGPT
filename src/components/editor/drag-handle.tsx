import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { GripVertical, Plus, Trash, Copy } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface DragHandleProps {
  editor: Editor;
}

export const DragHandle = ({ editor }: DragHandleProps) => {
  const [activeNodeRect, setActiveNodeRect] = useState<DOMRect | null>(null);
  const [activeNode, setActiveNode] = useState<any | null>(null);
  const [activePos, setActivePos] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleMouseMove = (e: MouseEvent) => {
      // If menu is open, don't update position
      if (menuOpen) return;

      const coords = { left: e.clientX, top: e.clientY };
      const pos = editor.view.posAtCoords(coords);

      // If we found a position in the editor
      if (pos) {
          const resolvedPos = editor.state.doc.resolve(pos.pos);
          // Get the start of the current block
          const blockPos = resolvedPos.before(1);
          const blockNode = editor.state.doc.nodeAt(blockPos);

          if (blockNode) {
              const domNode = editor.view.nodeDOM(blockPos) as HTMLElement;
              
              if (domNode && domNode instanceof HTMLElement) {
                  const rect = domNode.getBoundingClientRect();
                  
                  // Refined Y-check: Ensure we are strictly within the block's vertical bounds
                  // Added a small buffer (5px) for easier targeting
                  if (e.clientY >= rect.top && e.clientY <= rect.bottom + 5) {
                      setActiveNodeRect(rect);
                      setActiveNode(blockNode);
                      setActivePos(blockPos);
                      return;
                  }
              }
          }
      }
      
      // If we are not directly over a node, check if we are in the "gutter zone" of the currently active node.
      // This allows the user to move from the text to the handle without it disappearing.
      if (activeNodeRect) {
         // Define a gutter area to the left of the content
         const gutterLimit = activeNodeRect.left - 60; // How far left we can go before hiding
         const verticalBuffer = 10;

         if (e.clientX < activeNodeRect.left && e.clientX > gutterLimit && 
             e.clientY >= activeNodeRect.top - verticalBuffer && 
             e.clientY <= activeNodeRect.bottom + verticalBuffer) {
             return; // Keep visible
         }
      }

      // If neither, hide the handle
      setActiveNodeRect(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [editor, menuOpen, activeNodeRect]);

  const deleteNode = () => {
      if (activePos !== null) {
          editor.chain().focus().deleteRange({ from: activePos, to: activePos + (activeNode?.nodeSize || 0) }).run();
          setMenuOpen(false);
          setActiveNodeRect(null);
      }
  };

  const duplicateNode = () => {
    if (activeNode && activePos !== null) {
        const json = activeNode.toJSON();
        editor.chain().insertContentAt(activePos + (activeNode.nodeSize || 0), json).run();
        setMenuOpen(false);
    }
  };
  
  const addNodeBelow = () => {
      if (activePos !== null && activeNode) {
          const pos = activePos + activeNode.nodeSize;
          editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).run();
      }
  };

  if (!activeNodeRect) return null;

  return (
    <div 
        className="fixed z-50 flex items-center gap-1 transition-opacity duration-200"
        style={{ 
            top: activeNodeRect.top, 
            left: activeNodeRect.left - 54, // Adjusted offset to be closer to content
            height: 24, // Fixed height for the handle container
            transform: 'translateY(-2px)' // Visual adjustment
        }}
    >
        <button 
            onClick={addNodeBelow}
            className="p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="Add block below"
        >
            <Plus className="h-4 w-4" />
        </button>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
                <button 
                    className="p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-grab active:cursor-grabbing transition-colors"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={duplicateNode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={deleteNode} className="text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
};
