
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState, 
    addEdge, 
    BackgroundVariant,
    type Connection,
    type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export interface MindMapOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mindMap: {
      setMindMap: () => ReturnType;
    };
  }
}

const initialNodesData = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Central Idea' }, type: 'input' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Branch 1' } },
];
const initialEdgesData = [
  { id: 'e1-2', source: '1', target: '2' },
];

const MindMapComponent = ({ node, updateAttributes }: any) => {
    // In a real implementation, we would sync this state back to node.attrs
    // For now, we initialize from attrs if present, or defaults.
    // Syncing large JSON to attributes on every drag might be heavy, so we might want to debounce.
    
    const [nodes, setNodes, onNodesChange] = useNodesState(node.attrs.nodes || initialNodesData);
    const [edges, setEdges, onEdgesChange] = useEdgesState(node.attrs.edges || initialEdgesData);

    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    
    // Sync back to Tiptap attributes for persistence
    useEffect(() => {
        updateAttributes({ nodes, edges });
    }, [nodes, edges, updateAttributes]);

    const addNode = () => {
        const id = (nodes.length + 1).toString();
        const newNode = {
            id,
            position: { x: Math.random() * 300, y: Math.random() * 300 },
            data: { label: `New Node ${id}` },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <NodeViewWrapper className="mind-map-block my-10 relative border rounded-xl overflow-hidden shadow-sm bg-background h-[500px]">
             <div className="absolute top-4 right-4 z-10">
                <Button size="sm" variant="secondary" onClick={addNode}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                </Button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-slate-50 dark:bg-slate-900"
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls />
            </ReactFlow>
        </NodeViewWrapper>
    );
};

export const MindMapExtension = Node.create<MindMapOptions>({
  name: 'mindMap',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      nodes: {
        default: initialNodesData,
      },
      edges: {
        default: initialEdgesData,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mind-map"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mind-map' })];
  },

  addCommands() {
    return {
      setMindMap:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MindMapComponent);
  },
});
