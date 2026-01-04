import { useEffect, useState } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { Plus } from "lucide-react";

export const TableHoverMenu = () => {
    const { editor } = useCurrentEditor();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeTableRect, setActiveTableRect] = useState<DOMRect | null>(null);

    // Better approach: Attach event listener to the editor view DOM
    useEffect(() => {
        if (!editor) return;

        const dom = editor.view.dom;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const table = target.closest('table');
            
            if (table && dom.contains(table)) {
                const rect = table.getBoundingClientRect();
                setActiveTableRect(rect);
                setMenuOpen(true);
            } else {
                // Check if we are hovering our own menu buttons, if so don't close
                if (target.closest('.table-add-controls')) {
                    return;
                }
                
                // If we moved out of table and not into our controls, close.
                setMenuOpen(false);
            }
        };

        dom.addEventListener('mouseover', handleMouseOver);
        // Also listen on document for hovering the controls which might be outside editor padding
        document.addEventListener('mouseover', handleMouseOver);

        return () => {
             dom.removeEventListener('mouseover', handleMouseOver);
             document.removeEventListener('mouseover', handleMouseOver);
        };
    }, [editor]);

    if (!menuOpen || !activeTableRect || !editor) return null;

    // Calculate positions
    // Bottom button: Centered at bottom
    const bottomButtonStyle: React.CSSProperties = {
        position: 'fixed',
        top: activeTableRect.bottom + 2, // 2px gap
        left: activeTableRect.left + (activeTableRect.width / 2) - 12, // center 24px button
        zIndex: 50,
    };

    // Right button: Centered at right
    const rightButtonStyle: React.CSSProperties = {
        position: 'fixed',
        left: activeTableRect.right + 2,
        top: activeTableRect.top + (activeTableRect.height / 2) - 12,
        zIndex: 50,
    };

    const addRow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editor) {
            editor.chain().focus().addRowAfter().run();
        }
    };

    const addColumn = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editor) {
            editor.chain().focus().addColumnAfter().run();
        }
    };

    return (
        <div className="table-add-controls">
            {/* Add Row Button - Bottom */}
            <button 
                style={bottomButtonStyle}
                className="flex items-center justify-center w-6 h-4 bg-muted hover:bg-muted-foreground/20 rounded cursor-pointer transition-colors shadow-sm border"
                onClick={addRow}
                title="Add Row"
            >
                <Plus className="w-3 h-3 text-muted-foreground" />
            </button>

             {/* Add Column Button - Right */}
             <button 
                style={rightButtonStyle}
                className="flex items-center justify-center w-4 h-6 bg-muted hover:bg-muted-foreground/20 rounded cursor-pointer transition-colors shadow-sm border"
                onClick={addColumn}
                title="Add Column"
            >
                <Plus className="w-3 h-3 text-muted-foreground" />
            </button>
        </div>
    );
};
