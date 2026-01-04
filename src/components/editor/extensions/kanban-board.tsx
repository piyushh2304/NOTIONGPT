import React, { useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Reorder, useDragControls } from "framer-motion";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";

interface Card {
  id: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  cards: Card[];
}

const defaultColumns: Column[] = [
  {
    id: "not-started",
    title: "Not started",
    color: "bg-gray-200 dark:bg-gray-700",
    cards: [],
  },
  {
    id: "in-progress",
    title: "In progress",
    color: "bg-blue-200 dark:bg-blue-900",
    cards: [],
  },
  {
    id: "done",
    title: "Done",
    color: "bg-green-200 dark:bg-green-900",
    cards: [],
  },
];

export const KanbanBoard = (props: any) => {
  const [columns, setColumns] = useState<Column[]>(() => {
      // Initialize from node attributes if available, else default
      if (props.node.attrs.columns) {
          return props.node.attrs.columns;
      }
      return defaultColumns;
  });

  // Sync updates to Tiptap node attributes
  useEffect(() => {
    if (props.updateAttributes) {
        props.updateAttributes({ columns });
    }
  }, [columns, props]);

  const addCard = (columnId: string) => {
    const newCard: Card = {
      id: crypto.randomUUID(),
      content: "",
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
  };

  const updateCardContent = (columnId: string, cardId: string, content: string) => {
      setColumns((prev) =>
          prev.map((col) =>
              col.id === columnId
                  ? {
                        ...col,
                        cards: col.cards.map((card) =>
                            card.id === cardId ? { ...card, content } : card
                        ),
                    }
                  : col
          )
      );
  };

  return (
    <NodeViewWrapper className="kanban-board-wrapper my-6 overflow-x-auto">
       <div className="flex gap-4 min-w-full pb-4">
          {columns.map((column) => {
             // Determine styles based on column ID
             let colBg = "bg-secondary/30";
             let header = null;

             if (column.id === 'not-started') {
                 colBg = "bg-secondary/30"; // Default gray/translucent
                 header = (
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium text-foreground mr-1">{column.title}</span>
                        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
                     </div>
                 );
             } else if (column.id === 'in-progress') {
                 colBg = "bg-blue-500/10"; // Blue tint
                 header = (
                     <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-2">
                            {column.title}
                            <span className="opacity-70">{column.cards.length}</span>
                        </span>
                     </div>
                 );
             } else if (column.id === 'done') {
                 colBg = "bg-green-500/10"; // Green tint
                 header = (
                     <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-2">
                             {column.title}
                             <span className="opacity-70">{column.cards.length}</span>
                         </span>
                     </div>
                 );
             } else {
                 // Default fallback
                  header = (
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium text-foreground mr-1">{column.title}</span>
                        <span className="text-xs text-muted-foreground">{column.cards.length}</span>
                     </div>
                 );
             }

             return (
             <div key={column.id} className={`min-w-[260px] flex-1 ${colBg} rounded-xl p-3 flex flex-col gap-3 transition-colors`}>
                 <div className="flex items-center justify-between px-1 h-8">
                     {header}
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="hover:bg-muted/50 p-1 rounded text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                         <button onClick={() => addCard(column.id)} className="hover:bg-muted/50 p-1 rounded text-muted-foreground"><Plus className="w-4 h-4" /></button>
                     </div>
                 </div>

                 <Reorder.Group 
                    axis="y" 
                    values={column.cards} 
                    onReorder={(newCards) => {
                        setColumns(prev => prev.map(c => c.id === column.id ? {...c, cards: newCards} : c));
                    }}
                    className="flex flex-col gap-2 min-h-[10px]"
                 >
                     {column.cards.map((card) => (
                         <Reorder.Item key={card.id} value={card} className="relative group">
                             <div className="bg-[#191919] hover:bg-[#202020] p-3 rounded-lg shadow-sm border border-[#2c2c2c] flex flex-col gap-3 select-none cursor-grab active:cursor-grabbing group-hover:shadow-md transition-all">
                                 <div className="flex items-start gap-2">
                                     <div className="mt-0.5 text-muted-foreground opacity-70">
                                         <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path d="M4.5 1h7a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-11A1.5 1.5 0 0 1 4.5 1zm0 1a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-7z"/></svg> 
                                     </div>
                                     <input 
                                        className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-muted-foreground/50 text-foreground"
                                        placeholder="Type a name..."
                                        value={card.content}
                                        onChange={(e) => updateCardContent(column.id, card.id, e.target.value)}
                                        onPointerDown={(e) => e.stopPropagation()} 
                                     />
                                 </div>
                                 <div className="pl-6">
                                     <button className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                                         <span className="w-4 h-4 flex items-center justify-center rounded-full border border-dashed border-current">
                                             <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 fill-current"><path d="M8 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><path d="M8 11a5 5 0 0 0-4.546 2.914.5.5 0 1 1-.848.53C3.237 13.3 5.378 12 8 12s4.763 1.3 5.394 2.444a.5.5 0 1 1-.848.53C12.546 13.914 10.454 13 8 13z"/></svg>
                                         </span>
                                         Add Assign
                                     </button>
                                 </div>
                             </div>
                         </Reorder.Item>
                     ))}
                 </Reorder.Group>
                 
                 <div className="pt-1">
                     <button onClick={() => addCard(column.id)} className="flex items-center gap-2 text-muted-foreground/80 hover:text-foreground text-sm hover:bg-white/5 active:bg-white/10 p-2 rounded-lg w-full text-left transition-colors">
                         <Plus className="w-4 h-4" /> New {column.id === 'not-started' ? 'page' : 'item'}
                     </button>
                 </div>
             </div>
             );
          })}
          {/* New Column Button (visual only for now) */}
          <div className="min-w-[100px]">
              <button className="flex items-center gap-2 text-muted-foreground text-sm hover:bg-muted p-2 rounded">
                  <Plus className="w-4 h-4" /> New Group
              </button>
          </div>
       </div>
    </NodeViewWrapper>
  );
};
