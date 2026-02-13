
import { EditorBubble, EditorBubbleItem } from "novel";
import { useCurrentEditor } from "@tiptap/react";
import { Bold, Italic, Underline, Strikethrough, Code, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const EditorBubbleMenu = () => {
    const { editor } = useCurrentEditor();
     
    if (!editor) return null;

    return (
        <EditorBubble
            tippyOptions={{
                placement: "top",
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded border border-muted bg-background shadow-xl"
        >
            {/* @ts-ignore */}
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleBold().run()}
                className={cn("p-2 hover:bg-muted font-bold", editor.isActive("bold") && "text-blue-500")}
            >
                <Bold className="w-4 h-4" />
            </EditorBubbleItem>
            {/* @ts-ignore */}
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
                className={cn("p-2 hover:bg-muted italic", editor.isActive("italic") && "text-blue-500")}
            >
                <Italic className="w-4 h-4" />
            </EditorBubbleItem>
            {/* @ts-ignore */}
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
                className={cn("p-2 hover:bg-muted underline", editor.isActive("underline") && "text-blue-500")}
            >
                <Underline className="w-4 h-4" />
            </EditorBubbleItem>
            {/* @ts-ignore */}
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
                className={cn("p-2 hover:bg-muted line-through", editor.isActive("strike") && "text-blue-500")}
            >
                <Strikethrough className="w-4 h-4" />
            </EditorBubbleItem>
            {/* @ts-ignore */}
            <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleCode().run()}
                className={cn("p-2 hover:bg-muted", editor.isActive("code") && "text-blue-500")}
            >
                <Code className="w-4 h-4" />
            </EditorBubbleItem>
            {/* @ts-ignore */}
             <EditorBubbleItem
                onSelect={(editor) => editor.chain().focus().toggleHighlight().run()}
                className={cn("p-2 hover:bg-muted", editor.isActive("highlight") && "text-blue-500")}
            >
                <Highlighter className="w-4 h-4" />
            </EditorBubbleItem>
            
            <ColorSelector />
            <AISelector />
        </EditorBubble>
    );
};

import { 
    Sparkles, 
    Loader2, 
    Languages, 
    PenLine, 
    Search, 
    AlignLeft, 
    MoreHorizontal, 
    FileSearch 
} from "lucide-react";
import { AIEditorService } from "@/lib/ai-editor-service";
import { toast } from "sonner";
import { 
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandSeparator 
} from "@/components/ui/command";

const AISelector = () => {
    const { editor } = useCurrentEditor();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!editor) return null;

    const handleAIAction = async (actionType: string, instruction?: string) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to);

        if (!text && actionType !== 'continue') {
            toast.error("Please select some text first");
            return;
        }

        setIsLoading(true);
        try {
            let result = "";
            
            if (actionType === 'continue') {
                 // Get context before cursor
                 const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1000), from);
                 result = await AIEditorService.autocomplete({ context: textBefore });
            } else if (instruction) {
                 result = await AIEditorService.editContent({ text, instruction });
            }

            if (result) {
                if (actionType === 'continue') {
                    editor.chain().focus().insertContent(result).run();
                } else {
                    editor.chain().focus().insertContentAt({ from, to }, result).run();
                }
                setIsOpen(false);
                toast.success("Done!");
            }
        } catch (error) {
            toast.error("AI Action Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="p-2 hover:bg-muted text-sm font-medium flex items-center gap-1 text-purple-500">
                   <Sparkles className="w-4 h-4" />
                   <span className="text-xs font-bold">Ask AI</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-[#1F1F1F] border-zinc-700 text-zinc-100 shadow-2xl" align="start">
                 <Command className="bg-transparent text-zinc-100">
                    <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Notion AI
                    </div>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => handleAIAction('translate', 'Translate this to Spanish')} className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2">
                                <Languages className="w-4 h-4 text-green-500" />
                                <span>Translate to...</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleAIAction('continue')} className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2">
                                <PenLine className="w-4 h-4 text-purple-500" />
                                <span>Continue writing</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleAIAction('question', 'Identify key questions answered in this text')} className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2">
                                <Search className="w-4 h-4 text-blue-500" />
                                <span>Ask a question</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleAIAction('page-question', 'Summarize this page')} className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2">
                                <FileSearch className="w-4 h-4 text-blue-500" />
                                <span>Ask about this page</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleAIAction('edit', 'Make this text shorter and more concise')} className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2">
                                <AlignLeft className="w-4 h-4 text-purple-500" />
                                <span>Make shorter</span>
                            </CommandItem>
                            {isLoading && (
                                <div className="flex items-center justify-center p-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                </div>
                            )}
                        </CommandGroup>
                        <CommandSeparator className="bg-zinc-700" />
                         <CommandGroup>
                            <CommandItem className="data-[selected]:bg-zinc-800 cursor-pointer flex gap-2 items-center py-2 text-zinc-400">
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="flex-1">See more</span>
                                <kbd className="text-[10px] text-zinc-500">Ctrl+J</kbd>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                    <div className="px-3 py-2 border-t border-zinc-700 text-[10px] text-zinc-500 flex justify-between">
                         <span>Type '/' on the page</span>
                         <span>esc</span>
                    </div>
                 </Command>
            </PopoverContent>
        </Popover>
    )
}

const ColorSelector = () => {
    const { editor } = useCurrentEditor();
    const [isOpen, setIsOpen] = useState(false);

    if (!editor) return null;

    const colors = [
        { name: 'Default', color: 'inherit' },
        { name: 'Purple', color: '#9333ea' },
        { name: 'Red', color: '#e11d48' },
        { name: 'Blue', color: '#2563eb' },
        { name: 'Green', color: '#16a34a' },
        { name: 'Orange', color: '#ea580c' },
    ];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <button className="p-2 hover:bg-muted text-sm font-medium">
                    <span style={{ color: editor.getAttributes('textStyle').color || 'inherit' }}>A</span>
                 </button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1" align="start">
                {colors.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => {
                            editor.chain().focus().setColor(color.color).run();
                            setIsOpen(false);
                        }}
                        className="flex items-center justify-between w-full p-2 text-xs rounded hover:bg-muted"
                    >
                        <span style={{ color: color.color }}>{color.name}</span>
                        {editor.isActive('textStyle', { color: color.color }) && (
                            <span className="ml-2">✓</span>
                        )}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}
