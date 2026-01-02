import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  MessageSquareQuote,
  CheckSquare,
  TextIcon,
  Image as ImageIcon,
  Code,
  Quote,
  Table,
  Minus,
  Info,
  FileText,
  ListTree,
} from "lucide-react";
import { CommandList } from "./command-list";

interface CommandProps {
  editor: any;
  range: any;
}

const getSuggestionItems = () => [
  {
    title: "Text",
    description: "Start writing with plain text.",
    searchTerms: ["p", "paragraph"],
    icon: <TextIcon className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    searchTerms: ["h1", "header", "big"],
    icon: <Heading1 className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ["h2", "header", "medium"],
    icon: <Heading2 className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ["h3", "header", "small"],
    icon: <Heading3 className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a bulleted list.",
    searchTerms: ["ul", "unordered", "bullet"],
    icon: <List className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list.",
    searchTerms: ["ol", "ordered", "number"],
    icon: <ListOrdered className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do List",
    description: "Track tasks with checkboxes.",
    searchTerms: ["todo", "task", "checkbox"],
    icon: <CheckSquare className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Insert a quote block.",
    searchTerms: ["blockquote", "quote"],
    icon: <MessageSquareQuote className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    title: "Image",
    description: "Upload an image from device.",
    searchTerms: ["photo", "image", "picture", "media"],
    icon: <ImageIcon className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).run();

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },
  {
    title: "Code",
    description: "Capture a code snippet.",
    searchTerms: ["codeblock"],
    icon: <Code className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Toggle List",
    description: "Toggles can hide and show content inside.",
    searchTerms: ["toggle", "collapse"],
    icon: <ListTree className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setDetails().run();
    },
  },
  {
    title: "Table",
    description: "Insert a simple table.",
    searchTerms: ["table", "grid"],
    icon: <Table className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Divider",
    description: "Visually divide blocks.",
    searchTerms: ["divider", "hr", "line"],
    icon: <Minus className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Callout",
    description: "Make writing stand out.",
    searchTerms: ["callout", "box", "info"],
    icon: <Info className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      // Basic callout using blockquote for now if custom node not ready, 
      // OR assuming we will add a Callout node later. 
      // Let's use setBlockquote for now or a custom implementation if I build it.
      // I'll assume I will build a custom 'callout' or use 'blockquote' temporarily styled.
      // Actually, plan said "Callout extension". I haven't added it yet. 
      // I will add 'callout' command assuming I will add the extension in next step.
      // For now, let's map it to blockquote as placeholder if not present? 
      // No, user wants it exactly like Notion. I will add the extension next.
      // So I will use `setCallout()` command.
       editor.chain().focus().deleteRange(range).setCallout().run();
    },
  },
  {
    title: "Page",
    description: "Embed a sub-page inside this page.",
    searchTerms: ["page", "new"],
    icon: <FileText className="h-4 w-4" />,
    command: ({ editor, range }: CommandProps) => {
      // Placeholder for Page creation
       editor.chain().focus().deleteRange(range).insertContent("📄 [New Page] ").run();
    },
  },
];

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: any; clientRect: any }) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: any; clientRect: any }) => {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }
      return (component?.ref as any)?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const slashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
}).configure({
  suggestion: {
    items: ({ query }: { query: string }) => {
      return getSuggestionItems().filter((item) => {
        if (typeof query === "string" && query.length > 0) {
          const search = query.toLowerCase();
          return (
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            (item.searchTerms &&
              item.searchTerms.some((term: string) => term.includes(search)))
          );
        }
        return true;
      });
    },
    render: renderItems,
  },
});
