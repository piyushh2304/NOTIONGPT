import { Node, mergeAttributes } from '@tiptap/core'

export const CalloutExtension = Node.create({
    name: 'callout',

    group: 'block',

    content: 'inline*',

    addAttributes() {
        return {
            icon: {
                default: '💡',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="callout"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0]
    },

    addCommands() {
        return {
            setCallout: () => ({ commands }: { commands: any }) => {
                return commands.toggleNode(this.name)
            },
        } as any
    },
})
