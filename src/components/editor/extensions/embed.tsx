
import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

const EmbedComponent = ({ node, updateAttributes }: any) => {
  return (
    <NodeViewWrapper className="notion-embed-block my-4 relative group">
      <div className="w-full relative overflow-hidden rounded-md border bg-muted/20 aspect-video">
        <iframe
          className="w-full h-full absolute top-0 left-0"
          src={node.attrs.src}
          title="Embed"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {/* Overlay to allow selecting the node without interacting with iframe instantly */}
        <div className="absolute inset-0 z-10 hover:bg-transparent pointer-events-none group-hover:pointer-events-none" />
        
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow-sm">
             <a href={node.attrs.src} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground px-2">
                 Open Original
             </a>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground mt-1">
          {node.attrs.src}
      </div>
    </NodeViewWrapper>
  );
};

export const EmbedExtension = Node.create<EmbedOptions>({
  name: 'embed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'notion-embed-block' }, ['iframe', HTMLAttributes]];
  },

  addCommands() {
    return {
      setEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedComponent);
  },
});
