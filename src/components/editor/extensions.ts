import StarterKit from "@tiptap/starter-kit";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { Heading } from "@tiptap/extension-heading";
import Details from "@tiptap/extension-details";
import DetailsSummary from "@tiptap/extension-details-summary";
import DetailsContent from "@tiptap/extension-details-content";
import { mergeAttributes, Extension } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CodeBlockExtension } from "./extensions/code-block";
import { CalloutExtension } from "./extensions/callout";
import { PageLink } from "./extensions/page-link";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'

// Mock file uploader for drag/drop images
const fileUploadHandler = (file: File) => {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
    });
};

export const defaultExtensions = [
    StarterKit.configure({
        codeBlock: false,
        heading: false,
        paragraph: {
            HTMLAttributes: {
                class: "m-0 p-0",
            },
        },
        bulletList: {
            keepMarks: true,
            keepAttributes: true,
            HTMLAttributes: {
                class: "list-disc ml-5",
            },
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: true,
            HTMLAttributes: {
                class: "list-decimal ml-5",
            },
        },
    }),

    Heading.configure({
        levels: [1, 2, 3],
    }).extend({
        renderHTML({ node, HTMLAttributes }) {
            const level = node.attrs.level;
            const classes: Record<number, string> = {
                1: "text-4xl font-bold mt-6 first:mt-0 mb-2 tracking-tight", // H1
                2: "text-3xl font-semibold mt-5 first:mt-0 mb-2 tracking-tight", // H2
                3: "text-2xl font-semibold mt-4 first:mt-0 mb-1", // H3
            };
            return [
                `h${level}`,
                mergeAttributes(HTMLAttributes, { class: classes[level] }),
                0,
            ];
        },
    }),

    // Toggle list support like Notion
    Details.configure({ persist: true, openClassName: "open" }),
    DetailsSummary.configure({
        HTMLAttributes: {
            class: "flex items-center justify-between cursor-pointer font-medium",
        },
    }),
    DetailsContent.configure({
        HTMLAttributes: {
            class: "ml-4 border-l pl-3",
        },
    }),

    TaskList.configure({
        HTMLAttributes: {
            class: "notion-task-list",
        },
    }),
    TaskItem.configure({
        nested: true,
        HTMLAttributes: {
            class: "notion-task-item",
        },
    }),
    Color,
    TextStyle,
    Underline,
    Highlight.configure({ multicolor: true }),
    Image.configure({ allowBase64: true }),
    Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),

    // Dynamic placeholder behavior for lists & toggle like Notion
    Placeholder.configure({
        placeholder: ({ node, editor, pos }) => {
            if (node.type.name === "listItem" || node.type.name === "taskItem" || node.type.name === "bulletList" || node.type.name === "orderedList" || node.type.name === "taskList" || node.type.name === "details" || node.type.name === "detailsContent") {
                return "";
            }

            if (node.type.name === "heading") {
                return `Heading ${node.attrs.level}`;
            }
            if (node.type.name === "detailsSummary") {
                return "Section name";
            }

            // Check if paragraph is inside a list item
            if (node.type.name === "paragraph") {
                try {
                    const parent = editor.state.doc.resolve(pos).parent;
                    if (parent.type.name === 'listItem') {
                        return "List";
                    }
                    if (parent.type.name === 'taskItem') {
                        return "To-do";
                    }
                } catch (e) {
                    // ignore
                }
            }

            return "Press '/' for commands...";
        },
        includeChildren: true,
    }),
    GlobalDragHandle.configure({
        dragHandleWidth: 64, // Width of the drag handle zone (adds padding)
        scrollTreshold: 100,
    }),
    Extension.create({
        name: "listBackspace",
        addKeyboardShortcuts() {
            return {
                Backspace: () => {
                    const { empty, $from } = this.editor.state.selection;
                    if (!empty) return false;

                    // 1. Handle converting empty List Item -> Paragraph
                    const isTaskItemDirect = $from.parent.type.name === "taskItem";
                    const isListItemDirect = $from.parent.type.name === "listItem";

                    if ($from.parent.content.size === 0) {
                        if (isTaskItemDirect) return this.editor.commands.toggleTaskList();
                        if (isListItemDirect) return this.editor.commands.liftListItem("listItem");
                    }

                    // 2. Handle converting empty Paragraph inside List Item -> Paragraph (Grandparent check)
                    if ($from.parent.type.name === "paragraph" && $from.parent.content.size === 0) {
                        const grandParent = $from.node(-1);
                        if (grandParent) {
                            if (grandParent.type.name === "taskItem") {
                                return this.editor.commands.toggleTaskList();
                            }
                            if (grandParent.type.name === "listItem") {
                                return this.editor.commands.liftListItem("listItem");
                            }
                        }

                        // 3. Handle Second Backspace: Empty Paragraph -> Join into previous List
                        // If we are in a root-level paragraph that is empty, and the node before is a list,
                        // we want to delete this paragraph and move selection to end of the list.
                        if ($from.depth === 1) { // Top level paragraph
                            // Check node before
                            const index = $from.index(0);
                            if (index > 0) {
                                const prevNode = $from.doc.child(index - 1);
                                if (
                                    prevNode.type.name === "taskList" ||
                                    prevNode.type.name === "bulletList" ||
                                    prevNode.type.name === "orderedList"
                                ) {
                                    // Manually delete the empty paragraph and focus the end of previous list
                                    return this.editor.chain()
                                        .deleteSelection() // It's empty, so this might just do nothing or delete char, but we want to remove node
                                        .joinBackward() // Standard join might work now if we are explicit? 
                                        // Actually, precise way:
                                        // .command(({ tr, dispatch }) => {
                                        //     if (dispatch) {
                                        //         // Select previous node's end
                                        //         // The position before the current paragraph is $from.before(1)
                                        //         // We want to delete the range of this paragraph
                                        //         const start = $from.before(1);
                                        //         const end = $from.after(1);
                                        //         tr.delete(start, end);

                                        //         // Determine new selection at end of prevNode
                                        //         // prevNode ends at 'start'
                                        //         // We need to resolve position inside the last item of prevNode
                                        //         const resolvedPos = tr.doc.resolve(start - 1); // inside the list
                                        //         // We really want the end of the last item content.

                                        //         // Simplest: joinBackward usually handles this IF we nudge it?
                                        //         // But let's trust joinBackward works better if forced, OR:
                                        //         // Let's just return false and let default handle it? 
                                        //         // User says default DOESN'T work.

                                        //         // Alternative: selectNodeBackward?
                                        //     }
                                        //     return true;
                                        // })
                                        // Let's try simple joinBackward again, assuming the issue was specific context?
                                        // No, let's implement the delete-and-focus manually if reliable.
                                        // Actually, just `joinBackward` is the command for this. 
                                        // If it fails, maybe `selectNodeBackward`?
                                        .joinBackward()
                                        .run();
                                }
                            }
                        }
                    }

                    return false;
                },
            };
        },
    }),
    CodeBlockExtension,
    Table.configure({
        resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    CalloutExtension,
    Details.configure({
        persist: true,
        HTMLAttributes: {
            class: 'details',
        },
    }),
    DetailsContent,
    DetailsSummary,
    PageLink,
];

// Optional: handle drag & drop image upload
export const handleImageDrop = async (view: any, event: DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return false;

    for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
            const src = await fileUploadHandler(file);
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src });
            const transaction = view.state.tr.replaceSelectionWith(node);
            view.dispatch(transaction);
        }
    }
    return true;
};
