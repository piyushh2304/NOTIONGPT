import { useEditor, EditorContent, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import Heading from '@tiptap/extension-heading';

import { EditorBubbleMenu } from './editor-bubble-menu';
import { EditorFloatingMenu } from './editor-floating-menu';

import { SlashCommand } from './extensions/slash-command';
import { DragHandle } from './drag-handle';

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

// Custom Heading Extension
const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel ? node.attrs.level : this.options.levels[0]

    if (level === 1) {
      return ['h1', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "content-editable-leaf-rtl notranslate",
        style: `max-width: 100%; width: 100%; white-space: break-spaces; word-break: break-word; caret-color: var(--c-texPri); padding-top: 3px; padding-bottom: 3px; padding-inline: 2px; font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"; font-weight: 600; font-size: 1.875em; line-height: 1.3; margin: 0px; min-height: 1em; color: var(--c-texPri); -webkit-text-fill-color: var(--ca-texDisTra);`,
        placeholder: "Heading 1", // User requested attribute
      }), 0]
    }

    return ['h' + level, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
})

export const Editor = ({ onChange, initialContent, editable = true }: EditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable default heading
            }),
            CustomHeading, // Use our custom heading
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight,
            Underline,
            Link.configure({ openOnClick: false }),
            Image,
            Placeholder.configure({ 
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Heading ' + node.attrs.level
                    }
                    if (node.type.name === 'codeBlock') {
                        return 'Code'
                    }
                    if (node.type.name === 'bulletList') {
                        return 'List'
                    }
                    if (node.type.name === 'orderedList') {
                        return 'List'
                    }
                    if (node.type.name === 'taskList') {
                        return 'To-do'
                    }
                    if (node.type.name === 'blockquote') {
                        return 'Quote'
                    }
                  
                    return "Write, press 'space' for AI, '/' for commands..."
                },
                includeChildren: true, 
            }),
            BubbleMenuExtension, 
            FloatingMenuExtension,
            SlashCommand
        ],
        content: initialContent ? JSON.parse(initialContent) : '',
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
        editorProps: {
            attributes: {
                class: "outline-none min-h-[50vh] prose prose-stone dark:prose-invert max-w-none pl-12" 
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Backspace' && view.state.selection.$anchor.pos === 1) {
                    const titleInput = window.document.querySelector('textarea');
                    titleInput?.focus();
                   // Optional: Move cursor to end of title? 
                   // titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                   return true;
                }
                return false;
            }
        }
    });

    if (!editor) {
        return null; // Don't render if editor is not ready
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-40 relative group">
             {editable && (
                <>
                    <EditorBubbleMenu editor={editor} />
                    <DragHandle editor={editor} />
                </>
             )}
            <EditorContent editor={editor} />
        </div>
    );
};
