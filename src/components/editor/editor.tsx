import { useEditor, EditorContent, mergeAttributes, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import FloatingMenuExtension from '@tiptap/extension-floating-menu'
import Heading from '@tiptap/extension-heading'

import { EditorBubbleMenu } from './editor-bubble-menu'
import { SlashCommand } from './extensions/slash-command'
import { DragHandle } from './drag-handle'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
}

// Your Custom Heading UI (kept exactly)
const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel ? node.attrs.level : this.options.levels[0]

    const baseStyle = `max-width:100%;width:100%;white-space:break-spaces;word-break:break-word;caret-color:var(--c-texPri);
      padding-top:3px;padding-bottom:3px;padding-inline:2px;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,
      "Segoe UI",Helvetica,Apple Color Emoji,Arial,sans-serif;font-weight:600;line-height:1.3;margin:0;min-height:1em;color:var(--c-texPri);`

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "content-editable-leaf-rtl notranslate",
        style: `${baseStyle} font-size:${level === 1 ? "1.875em" : level === 2 ? "1.5em" : "1.25em"};`,
        placeholder: `Heading ${level}`,
        spellcheck: "true",
        "data-content-editable-leaf": "true",
      }),
      0
    ]
  }
})

// 🔥 New Notion-like INLINE Toggle (arrow at END)
const ToggleListItem = Extension.create({
  name: 'toggleListItem',

  addNodes() {
    return [
      {
        name: 'toggleListItem',
        group: 'block',
        content: 'inline*',
        draggable: true,

        addAttributes() {
          return { open: { default: false } }
        },

        parseHTML() {
          return [{ tag: 'div[data-toggle-item]' }]
        },

        renderHTML({ node }) {
          return [
            'div',
            {
              'data-toggle-item': 'true',
              class: 'flex items-center justify-between gap-2 w-full m-0 p-0',
              style: 'margin:0;padding:0;line-height:1.2;min-height:24px;'
            },
            [
              'div',
              { class: 'flex items-center gap-1 flex-1' },
              ['span', { class: 'font-bold', style: 'font-size:20px;' }, '+'],
              ['span', { class: 'font-mono opacity-70', style: 'font-size:16px;' }, '::'],
              ['span', { class: 'flex-1' }, 0]
            ],
            [
              'span',
              {
                class: 'toggle-arrow cursor-pointer select-none text-lg',
                onclick: 'this.parentElement.dispatchEvent(new Event("toggle-click"))',
                style: 'margin:0;padding:0;display:inline-flex;'
              },
              node.attrs.open ? '▼' : '▶'
            ]
          ]
        },

        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { $anchor } = this.editor.state.selection
              const parent = $anchor.parent
              if (parent.type.name === 'toggleListItem' && parent.textContent.length === 0) {
                return this.editor.chain().focus().deleteNode('toggleListItem').run()
              }
              return false
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ chain, state }) => {
          const pos = state.selection.from
          return chain()
            .focus()
            .insertContentAt(pos, { type: 'toggleListItem', content: [{ type: 'text', text: '' }] })
            .focus(pos + 1)
            .run()
        }
    }
  }
})

export const Editor = ({ onChange, initialContent, editable = true }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),

      CustomHeading,
      ToggleListItem,

      TaskList.configure({ HTMLAttributes: { class: "not-prose p-0 my-0 list-none" } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: "flex gap-2 items-start mb-0 py-0.5" } }),

      Highlight,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,

      Placeholder.configure({
        placeholder: ({ node, editor, pos }) => {
          if (node.type.name === 'heading') return `Heading ${node.attrs.level}`
          if (node.type.name === 'toggleListItem') return "Toggle"
          if (node.type.name === 'codeBlock') return "Code"
          if (node.type.name === 'blockquote') return "Empty quote"

          if (node.type.name === 'paragraph') {
            try {
              const $pos = editor.state.doc.resolve(pos)
              for (let d = $pos.depth; d > 0; d--) {
                const ancestor = $pos.node(d)
                if (ancestor?.type.name === 'listItem') return "List"
                if (ancestor?.type.name === 'taskItem') return "To-do"
                if (ancestor?.type.name === 'toggleListItem') return "Toggle"
              }
            } catch {}
            return "Write, press '/' for commands..."
          }
          return ""
        },
        includeChildren: true,
        showOnlyCurrent: false,
      }),

      BubbleMenuExtension,
      FloatingMenuExtension,
      SlashCommand.configure({
        suggestion: { char: '/', startOfLine: false }
      })
    ],

    content: initialContent ? JSON.parse(initialContent) : '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange(JSON.stringify(json))
      return true
    },

    editorProps: {
      attributes: { class: "outline-none min-h-[50vh] prose prose-stone dark:prose-invert max-w-none px-14" },

      handleKeyDown: (view, event) => {
        // Keep your existing top-backspace behavior
        if (event.key === 'Backspace' && view.state.selection.$anchor.pos === 1) {
          const titleInput = window.document.querySelector('textarea')
          titleInput?.focus()
          return true
        }
        return false
      }
    }
  })

  if (!editor) return null

  // Toggle open/close behavior
  editor.view.dom.addEventListener('toggle-click', () => {
    const { $head } = editor.state.selection
    const node = $head.parent
    if (node.type.name === 'toggleListItem') {
      editor.chain().updateAttributes('toggleListItem', { open: !node.attrs.open }).run()
    }
  })

  return (
    <div className="w-full pb-40 relative group">
      {editable && (
        <>
          <EditorBubbleMenu editor={editor} />
          <DragHandle editor={editor} />
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

export default Editor
