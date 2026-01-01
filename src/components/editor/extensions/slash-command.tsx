
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandList } from '../slash-command-list';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  MessageSquareQuote, 
  Code, 
  CheckSquare,
  TextIcon,
  ChevronRight
} from 'lucide-react';

const Command = Extension.create({
  name: 'slash-command',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
});

const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      searchTerms: ['h1', 'header', 'big'],
      icon: <Heading1 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
      section: 'Suggested',
      shortcut: '#',
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      searchTerms: ['h2', 'header', 'medium'],
      icon: <Heading2 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
      section: 'Suggested',
      shortcut: '##',
    },
    {
      title: 'Code',
      description: 'Capture a code snippet.',
      searchTerms: ['codeblock', 'programming'],
      icon: <Code className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
      section: 'Suggested',
      shortcut: '```',
    },
    {
      title: 'Text',
      description: 'Just start writing with plain text.',
      searchTerms: ['p', 'paragraph'],
      icon: <TextIcon className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run();
      },
      section: 'Basic blocks',
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      searchTerms: ['h3', 'header', 'small'],
      icon: <Heading3 className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
      section: 'Basic blocks',
      shortcut: '###',
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list.',
      searchTerms: ['ul', 'unordered'],
      icon: <List className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
      section: 'Basic blocks',
      shortcut: '-',
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      searchTerms: ['ol', 'ordered'],
      icon: <ListOrdered className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
      section: 'Basic blocks',
      shortcut: '1.',
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list.',
      searchTerms: ['todo', 'task', 'check'],
      icon: <CheckSquare className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
      section: 'Basic blocks',
      shortcut: '[]',
    },
    {
      title: 'Quote',
      description: 'Capture a quote.',
      searchTerms: ['blockquote', 'quote'],
      icon: <MessageSquareQuote className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run();
      },
      section: 'Basic blocks',
      shortcut: '>',
    },
    {
      title: 'Toggle List',
      description: 'Toggles can hide and show content inside.',
      searchTerms: ['toggle', 'summary', 'details'],
      icon: <ChevronRight className="h-4 w-4" />,
      command: ({ editor, range }: any) => {
        const { state } = editor;
        const $pos = state.doc.resolve(range.from);
        const parent = $pos.parent;
        const isOnlySlash = parent.textContent.trim() === '/toggle' || parent.textContent.trim() === '/';

        if (isOnlySlash) {
          // If the line is only the slash command, delete the whole block and insert
          editor.chain()
            .focus()
            .deleteRange({ from: $pos.before(), to: $pos.after() })
            .insertContent({
                type: "details",
                content: [
                    { type: "detailsSummary" },
                    { type: "detailsContent", content: [{ type: "paragraph" }] }
                ]
            })
            .run();
        } else {
          // Otherwise just delete the command and wrap
          editor.chain()
            .focus()
            .deleteRange(range)
            .setDetails()
            .run();
        }
      },
      section: 'Basic blocks',
    }
  ].filter(item => {
    if (typeof query === 'string' && query.length > 0) {
      const search = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
      );
    }
    return true;
  });
};

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(SlashCommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate: (props: any) => {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }

      return (component?.ref as any)?.onKeyDown(props);
    },

    onExit: () => {
      popup[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommand = Command.configure({
    suggestion: {
        items: getSuggestionItems,
        render: renderItems,
    },
});
