import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { KanbanBoard } from "./kanban-board";

export const KanbanBoardExtension = Node.create({
    name: "kanbanBoard",

    group: "block",

    atom: true,

    addAttributes() {
        return {
            columns: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "kanban-board",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["kanban-board", mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(KanbanBoard);
    },

    addCommands() {
        return {
            insertKanbanBoard: () => ({ commands }: { commands: any }) => {
                return commands.insertContent({
                    type: this.name,
                });
            },
        } as any;
    }
});
