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
import { TableHoverMenu } from "./table-hover-menu";
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
        
        const target = e.target as HTMLElement;
        const isWrapper = target === e.currentTarget;
        const isProseMirror = target.classList.contains('ProseMirror');

        if (isWrapper || isProseMirror) {
            const lastNode = editor.state.doc.lastChild;
            
            // If the last node is a pageLink or table, insert a new paragraph at the end
            if (lastNode && (lastNode.type.name === 'pageLink' || lastNode.type.name === 'table')) {
                 e.preventDefault();
                 editor.chain()
                       .insertContentAt(editor.state.doc.content.size, { type: 'paragraph' })
                       .focus()
                       .scrollIntoView()
                       .run();
            } else {
                 // Otherwise focus the end. 
                 // If the last node is already an empty paragraph, this focuses it.
                 e.preventDefault();
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
                 <TableHoverMenu />
             </EditorContent>
        </div>
    );
}

export default function Editor({ onChange, initialContent }: EditorProps) {
  const [content, setContent] = useState<any>(() => {
      if (!initialContent) return undefined;
      try {
          return typeof initialContent === 'string' ? JSON.parse(initialContent) : initialContent;
      } catch (e) {
          console.warn("Failed to parse initialContent as JSON, treating as plain text:", e);
          // Fallback: Create a valid Tiptap document with the plain text string
          return {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: typeof initialContent === 'string' ? initialContent : String(initialContent)
                        }
                    ]
                }
            ]
          };
      }
  });

  useEffect(() => {
    // If we passed initialContent, respect it (handling both string/object)
    if (initialContent) {
        try {
            setContent(typeof initialContent === 'string' ? JSON.parse(initialContent) : initialContent);
        } catch (e) {
            console.warn("Failed to parse initialContent in useEffect, treating as plain text:", e);
             // Fallback: Create a valid Tiptap document with the plain text string
             setContent({
                type: "doc",
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: typeof initialContent === 'string' ? initialContent : String(initialContent)
                            }
                        ]
                    }
                ]
              });
        }
    } else {
      // Fallback to local storage if no initialContent
      const saved = localStorage.getItem("novel-content");
      if (saved) {
        try {
            setContent(JSON.parse(saved));
        } catch(e) { console.error("Failed to parse local storage content", e); }
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
