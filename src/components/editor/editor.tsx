import { EditorRoot, EditorContent } from "novel";
import { defaultExtensions } from "./extensions";
import { EditorBubbleMenu } from "./editor-bubble";
import { slashCommand } from "./slash-command";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "tippy.js/dist/tippy.css";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAuth } from "@/context/auth-context";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  documentId?: string;
  readOnly?: boolean;
}

import { DragHandleMenu } from "./drag-handle-menu";
import { TableHoverMenu } from "./table-hover-menu";
import { useCurrentEditor } from "@tiptap/react";

const ensureValidDoc = (content: any) => {
    if (!content) return { type: "doc", content: [] };
    if (content.type === "doc" && Array.isArray(content.content)) return content;
    if (Array.isArray(content)) return { type: "doc", content: content.filter(n => n && typeof n === 'object' && n.type) };
    if (content && typeof content === 'object' && content.type) return { type: "doc", content: [content] };
    return {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: typeof content === 'string' ? content : "Invalid content format" }]
            }
        ]
    };
};

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
                    e.preventDefault(); 
                    e.stopPropagation();
                    const x = rect.right + 10;
                    const y = rect.top + (rect.height / 2);
                    const pos = editor.view.posAtCoords({ left: x, top: y });
                    
                    if (pos) {
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

const EditorView = ({ onUpdate, extensions, provider, readOnly, initialContent }: { onUpdate: (editor: any) => void, extensions: any[], provider: HocuspocusProvider | null, readOnly?: boolean, initialContent?: string }) => {
    const { editor } = useCurrentEditor();

    useEffect(() => {
        if (editor && readOnly !== undefined) {
            editor.setEditable(!readOnly);
        }
    }, [editor, readOnly]);

    useEffect(() => {
        // If readOnly and we have initialContent, set it explicitly since we don't have a provider syncing data
        if (editor && readOnly && initialContent && editor.isEmpty) {
             try {
                 const content = typeof initialContent === 'string' ? JSON.parse(initialContent) : initialContent;
                 editor.commands.setContent(content);
             } catch (e) {
                 console.error("Failed to set initial content", e);
             }
        }
    }, [editor, readOnly, initialContent]);

    const handleContainerClick = (e: React.MouseEvent) => {
        if (!editor || readOnly) return;
        
        const target = e.target as HTMLElement;
        const isWrapper = target === e.currentTarget;
        const isProseMirror = target.classList.contains('ProseMirror');

        if (isWrapper || isProseMirror) {
            const lastNode = editor.state.doc.lastChild;
            if (lastNode && (lastNode.type.name === 'pageLink' || lastNode.type.name === 'table')) {
                 e.preventDefault();
                 editor.chain()
                       .insertContentAt(editor.state.doc.content.size, { type: 'paragraph' })
                       .focus()
                       .scrollIntoView()
                       .run();
            } else {
                 e.preventDefault();
                 editor.chain().focus('end').run();
            }
        }
    };

    return (
        <div 
            className={`relative min-h-[500px] w-full max-w-screen-lg bg-white sm:mb-[calc(20vh)] sm:rounded-lg border-0 shadow-none p-12 px-8 sm:px-12 ${readOnly ? '' : 'cursor-text'}`}
            onClick={handleContainerClick}
        >
             <EditorContent
                extensions={extensions}
                className="outline-none" 
                editorProps={{
                     attributes: {
                         class: 'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
                         spellcheck: 'false',
                     }
                }}
                onUpdate={({ editor }) => onUpdate(editor)}
             >
                 {!readOnly && <EditorBubbleMenu />}
                 {!readOnly && <DragHandleListener />}
                 {!readOnly && <TableHoverMenu />}
             </EditorContent>
        </div>
    );
}

const COLORS = ["#958DF1", "#F98181", "#FBBC88", "#FAF594", "#70CFF8", "#94FADB", "#B9F18D"];

export default function Editor({ onChange, initialContent, documentId, readOnly = false }: EditorProps) {
  const { user } = useAuth();
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  
  // Initialize Provider
  useEffect(() => {
      // If readOnly, we don't connect to collab server for now to keep it simple and fast
      if (!documentId || readOnly) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const collabUrl = import.meta.env.VITE_COLLAB_URL || `${protocol}//${window.location.hostname}:1234`;

      const newProvider = new HocuspocusProvider({
          url: collabUrl,
          name: documentId,
          // token: "access_token", // Add auth token here if needed
      });

      setProvider(newProvider);

      const persistence = new IndexeddbPersistence(documentId, newProvider.document);
      
      persistence.on('synced', () => {
          console.log('Local content loaded');
      });

      return () => {
          newProvider.destroy();
          persistence.destroy();
      };
  }, [documentId, readOnly]);

  const extensions = useMemo(() => {
      if (!provider || !user || readOnly) {
          // Fallback extensions without collaboration
          return [...defaultExtensions, slashCommand];
      }

      return [
          ...defaultExtensions,
          slashCommand,
          Collaboration.configure({
              document: provider.document,
          }),
          CollaborationCursor.configure({
              provider: provider,
              user: {
                  name: user.fullName || "Anonymous",
                  color: COLORS[Math.floor(Math.random() * COLORS.length)],
                  avatar: user.avatarUrl,
              },
          }),
      ];
  }, [provider, user, readOnly]);

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
      if (readOnly) return;
      const json = editor.getJSON();
      // Only call onChange for saving to DB (persistence)
      // Real-time sync is handled by Y.js
      onChange(JSON.stringify(json));
  };

  const debouncedUpdate = debounce(handleUpdate, 1000);

  // If readOnly, we render immediately. 
  // If not readOnly and documentId exists, wait for provider.
  if (documentId && !provider && !readOnly) return <div>Connecting to collaboration server...</div>;

  return (
    <EditorRoot>
       <EditorView 
            onUpdate={debouncedUpdate} 
            extensions={extensions} 
            provider={provider}
            readOnly={readOnly}
            initialContent={initialContent}
       />
    </EditorRoot>
  )
}
