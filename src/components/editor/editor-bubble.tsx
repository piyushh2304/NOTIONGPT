
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
        </EditorBubble>
    );
};

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
