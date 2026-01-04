import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  BackgroundVariant,
  Handle, 
  Position,
} from 'reactflow';
import type { Connection, Edge, Node, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain } from "lucide-react";
import { cn } from "../../lib/utils";

// Custom Mind Map Node Component
const MindMapNode = ({ data }: NodeProps) => {
    return (
        <div 
            className={cn(
                "px-4 py-3 rounded-2xl shadow-sm border-2 transition-transform hover:scale-105",
                "font-semibold text-center min-w-[100px]",
                data.isRoot ? "text-xl px-6 py-4 shadow-md" : "text-sm"
            )}
            style={{ 
                backgroundColor: data.color || '#fff', 
                borderColor: data.borderColor || '#ddd',
                color: '#333'
            }}
        >
            <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
            
            {data.label}
            
            <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
            <Handle type="source" position={Position.Left} className="!bg-transparent !border-none" />
            <Handle type="source" position={Position.Right} className="!bg-transparent !border-none" />
        </div>
    );
};

interface MindMapViewerProps {
    isOpen: boolean;
    onClose: () => void;
    initialNodes: Node[];
    initialEdges: Edge[];
}

export function MindMapViewer({ isOpen, onClose, initialNodes, initialEdges }: MindMapViewerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const nodeTypes = useMemo(() => ({ mindMapNode: MindMapNode }), []);

    useEffect(() => {
        if (isOpen && initialNodes) {
            setNodes(initialNodes);
            setEdges(initialEdges || []);
        }
    }, [isOpen, initialNodes, initialEdges, setNodes, setEdges]);

    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="p-4 border-b bg-muted/20">
                     <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        Mind Map Viewer
                     </DialogTitle>
                </DialogHeader>
                <div className="flex-1 w-full h-full min-h-0 bg-[#FFFBF5] dark:bg-[#1a1a1a]"> 
                    {/* Cream background for that organic feel */}
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Controls />
                        <MiniMap zoomable pannable className='!bg-muted/50' />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e5e5" />
                    </ReactFlow>
                </div>
            </DialogContent>
        </Dialog>
    );
}
