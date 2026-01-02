import { EditorRoot, EditorContent } from "novel";
import { defaultExtensions } from "./extensions";
import { EditorBubbleMenu } from "./editor-bubble";
import { slashCommand } from "./slash-command";
import { useState, useEffect, useRef, useCallback } from "react";
import "tippy.js/dist/tippy.css";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
}

import { DragHandleMenu } from "./drag-handle-menu";
import { useCurrentEditor } from "@tiptap/react";

const DragHandleListener = () => {
    const { editor } = useCurrentEditor();
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);

    useEffect(() => {
        if (!editor) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('drag-handle')) {
                const rect = target.getBoundingClientRect();
                const isPlusIcon = e.clientX - rect.left < rect.width / 2;

                if (isPlusIcon) {
                    // Plus icon clicked - Add new block
                    e.preventDefault();
                    e.stopPropagation();

                    const x = rect.right + 10;
                    const y = rect.top + (rect.height / 2);
                    const pos = editor.view.posAtCoords({ left: x, top: y });

                    if (pos) {
                        const node = editor.state.doc.nodeAt(pos.pos);
                        if (node) {
                            const endPos = pos.pos + node.nodeSize;
                            editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run();
                        } else {
                            editor.chain().focus().createParagraphNear().run();
                        }
                    }
                } else {
                    // Drag icon (::) clicked - Open Menu
                    e.preventDefault(); 
                    e.stopPropagation();
                    
                    // Select the node associated with the handle
                    const x = rect.right + 10;
                    const y = rect.top + (rect.height / 2);
                    const pos = editor.view.posAtCoords({ left: x, top: y });
                    
                    if (pos) {
                        // We use setNodeSelection to select the block
                        editor.commands.setNodeSelection(pos.pos);
                    }

                    setMenuPos({ x: e.clientX, y: e.clientY + 10 });
                    setMenuOpen(true);
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [editor]);

    return (
        <DragHandleMenu 
            isOpen={menuOpen} 
            onClose={() => setMenuOpen(false)} 
            position={menuPos} 
        />
    );
}

const EditorView = ({ initialContent, onUpdate }: { initialContent: any, onUpdate: (editor: any) => void }) => {
    const { editor } = useCurrentEditor();

    const handleContainerClick = (e: React.MouseEvent) => {
        if (!editor) return;
        
        if (e.target === e.currentTarget) {
            e.preventDefault();
            const lastNode = editor.state.doc.lastChild;
            
            // If the last node is a pageLink, insert a new paragraph at the end
            if (lastNode && lastNode.type.name === 'pageLink') {
                 editor.chain()
                       .insertContentAt(editor.state.doc.content.size, { type: 'paragraph' })
                       .focus()
                       .scrollIntoView()
                       .run();
            } else {
                 // Otherwise focus the end. 
                 // If the last node is already an empty paragraph, this focuses it.
                 editor.chain().focus('end').run();
            }
        }
    };

    return (
        <div 
            className="relative min-h-[500px] w-full max-w-screen-lg bg-white sm:mb-[calc(20vh)] sm:rounded-lg border-0 shadow-none p-12 px-8 sm:px-12 cursor-text"
            onClick={handleContainerClick}
        >
             <EditorContent
                extensions={[...defaultExtensions, slashCommand]}
                initialContent={initialContent}
                className="outline-none" // Remove default outline
                editorProps={{
                     attributes: {
                         class: 'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
                     }
                }}
                onUpdate={({ editor }) => onUpdate(editor)}
             >
                 <EditorBubbleMenu />
                 <DragHandleListener />
             </EditorContent>
        </div>
    );
}

export default function Editor({ onChange, initialContent }: EditorProps) {
  const [content, setContent] = useState<any>(initialContent ? JSON.parse(initialContent) : undefined);

  useEffect(() => {
    if (!initialContent) {
      const saved = localStorage.getItem("novel-content");
      if (saved) {
        setContent(JSON.parse(saved));
      }
    }
  }, [initialContent]);

    const debounce = (func: Function, delay: number) => {
        const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        
        return useCallback((...args: any[]) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                func(...args);
            }, delay);
        }, [func, delay]);
    };

  const handleUpdate = (editor: any) => {
      const json = editor.getJSON();
      window.localStorage.setItem("novel-content", JSON.stringify(json));
      onChange(JSON.stringify(json));
  };

  const debouncedUpdate = debounce(handleUpdate, 500);

  return (
    <EditorRoot>
       <EditorView initialContent={content} onUpdate={debouncedUpdate} />
    </EditorRoot>
  )
}
