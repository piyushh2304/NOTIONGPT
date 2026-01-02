import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  Trash,
  Copy,
  MessageSquare,
  CornerUpRight,
  RefreshCw,
  Palette,
  Link,
  Clipboard,
  Sparkles,
  User,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRightSquare,
  Code2,
  Quote,
  StickyNote,
  FileText,
  Braces,
  Sigma,
  RefreshCcw,
  ToggleLeft,
  Columns
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { useDocuments } from "@/hooks/use-documents";
import { toast } from "sonner";

import { useParams } from "react-router-dom";

interface DragHandleMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number } | null;
}

export const DragHandleMenu = ({ isOpen, onClose, position }: DragHandleMenuProps) => {
  const { editor } = useCurrentEditor();
  const { createDocument } = useDocuments();
  const { documentId } = useParams();

  const handleTurnIntoPage = async () => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ') || "Untitled";

        // Pass documentId as the parentDocument to create a nested page
        const promise = createDocument(text, documentId);

        toast.promise(promise, {
            loading: "Creating page...",
            success: (doc) => {
                // Insert the custom 'pageLink' block
                editor.chain()
                      .focus()
                      .deleteSelection() // Deletes the old block
                      .insertContent({
                          type: 'pageLink',
                          attrs: {
                              title: doc.title,
                              href: `/dashboard/documents/${doc._id}`,
                              id: doc._id
                          }
                      }) 
                      .run();

                onClose();
                return "Turned into page!";
            },
            error: "Failed to create page"
        });
  };

  // We use a virtual trigger positioned at the click coordinates
  if (!position) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuTrigger asChild>
        <div
            className="fixed w-1 h-1 bg-transparent pointer-events-none"
            style={{ left: position.x, top: position.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-[#1F1F1F] border-[#2A2A2A] text-[#D4D4D4] p-1 rounded-md shadow-2xl" align="start" side="left" sideOffset={5}>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {/* Search inputs usually go here in Notion, simplified as placeholder for now or we can use a command input if available */}
             <input
                type="text"
                placeholder="Search actions..."
                className="w-full bg-transparent border border-[#3A3A3A] rounded px-2 py-1 text-xs outline-none focus:border-blue-500 placeholder:text-muted-foreground"
            />
        </div>

        <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            To-do list
        </div>

        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none md:w-full">
                <RefreshCw className="w-4 h-4" />
                <span>Turn into</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 bg-[#1F1F1F] border-[#2A2A2A] p-0 max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    <span>Text</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading1 className="w-4 h-4 text-muted-foreground" />
                    <span>Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading2 className="w-4 h-4 text-muted-foreground" />
                    <span>Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading3 className="w-4 h-4 text-muted-foreground" />
                    <span>Heading 3</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTurnIntoPage} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>Page</span>
                </DropdownMenuItem>
                <DropdownMenuItem title="Page in" className="flex items-center justify-between gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>Page in</span>
                    </div>
                    <ChevronRightSquare className="w-3 h-3 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBulletList().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <List className="w-4 h-4 text-muted-foreground" />
                    <span>Bulleted list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <ListOrdered className="w-4 h-4 text-muted-foreground" />
                    <span>Numbered list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <span>To-do list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { if(editor?.can().setDetails()) editor?.chain().focus().setDetails().run() }} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    <span>Toggle list</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    <span>Code</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Quote className="w-4 h-4 text-muted-foreground" />
                    <span>Quote</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCallout().run()} className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    <span>Callout</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Sigma className="w-4 h-4 text-muted-foreground" />
                    <span>Block equation</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                    <span>Synced block</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading1 className="w-4 h-4 text-muted-foreground" />
                    <span>Toggle heading 1</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading2 className="w-4 h-4 text-muted-foreground" />
                    <span>Toggle heading 2</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Heading3 className="w-4 h-4 text-muted-foreground" />
                    <span>Toggle heading 3</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Columns className="w-4 h-4 text-muted-foreground" />
                    <span>2 columns</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Columns className="w-4 h-4 text-muted-foreground" />
                    <span>3 columns</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Columns className="w-4 h-4 text-muted-foreground" />
                    <span>4 columns</span>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-center gap-2 hover:bg-[#2A2A2A] text-[#D4D4D4] text-xs px-2 py-1.5 cursor-pointer">
                    <Columns className="w-4 h-4 text-muted-foreground" />
                    <span>5 columns</span>
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none md:w-full">
                <Palette className="w-4 h-4" />
                <span>Color</span>
            </DropdownMenuSubTrigger>
             <DropdownMenuSubContent className="w-48 bg-[#1F1F1F] border-[#2A2A2A]">
                <DropdownMenuItem className="hover:bg-[#2A2A2A] text-[#D4D4D4]">Default</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#2A2A2A] text-[#D4D4D4] text-red-400">Red</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#2A2A2A] text-[#D4D4D4] text-blue-400">Blue</DropdownMenuItem>
             </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
            <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                <span>Copy link to block</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Alt+Shift+L</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4" />
                <span>Duplicate</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ctrl+D</span>
        </DropdownMenuItem>

         <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <CornerUpRight className="w-4 h-4" />
                <span>Move to</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ctrl+Shift+P</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <Trash className="w-4 h-4" />
                <span>Delete</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Del</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3A3A3A]" />

         <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Comment</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ctrl+Shift+M</span>
        </DropdownMenuItem>

         <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Suggest edits</span>
            </div>
             <span className="text-[10px] text-muted-foreground">wd</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3A3A3A]" />

         <DropdownMenuItem className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] text-sm rounded-sm cursor-pointer outline-none">
             <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Ask AI</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Ctrl+J</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3A3A3A]" />
        
        <div className="px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Last edited by Piyush Rajput</div>
            <div className="text-[10px] text-muted-foreground">Today at 12:13 AM</div>
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};
