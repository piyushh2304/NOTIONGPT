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
import { Brain, FileText, Cpu, Paperclip, Share2, ZoomIn, Maximize2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Custom Mind Map Node Component
const MindMapNode = ({ data }: NodeProps) => {
    const isRoot = data.isRoot;
    const depth = data.depth || 0;
    const side = data.side || 'right';

    const getIcon = () => {
        if (isRoot) return <Brain className="w-10 h-10 text-indigo-500" />;
        if (depth === 1) return <Cpu className="w-5 h-5 text-indigo-400" />;
        return <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />;
    };

    if (isRoot) {
        return (
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center p-6"
            >
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-28 h-28 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center transition-all hover:scale-110">
                        {getIcon()}
                    </div>
                 </div>
                 
                 <div className="mt-8 px-10 py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-indigo-100/50 dark:border-indigo-900/30 whitespace-nowrap flex items-center gap-4 transition-all hover:shadow-indigo-500/10">
                    <span className="text-3xl font-black tracking-tight font-montserrat bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-indigo-700 to-purple-800 dark:from-white dark:to-indigo-300">
                        {data.label}
                    </span>
                    <Share2 className="w-5 h-5 text-indigo-400/50" />
                 </div>

                 {/* Root Source Handles */}
                 <Handle type="source" position={Position.Right} id="source-right" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900" />
                 <Handle type="source" position={Position.Left} id="source-left" className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900" />
            </motion.div>
        );
    }

    if (depth === 1) {
        return (
            <motion.div 
                initial={{ x: side === 'right' ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                    "px-6 py-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all hover:scale-105 flex items-center min-w-[220px] max-w-[320px] group",
                    side === 'left' ? "flex-row-reverse text-right" : "flex-row text-left",
                    "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                )}
            >
                {/* Target Handle from Root */}
                <Handle 
                    type="target" 
                    position={side === 'right' ? Position.Left : Position.Right} 
                    id={side === 'right' ? 'target-left' : 'target-right'} 
                    className="!w-2.5 !h-2.5 !bg-indigo-400 !border-white dark:!border-slate-800" 
                />
                
                <div className={cn(
                    "p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 shadow-inner group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors", 
                    side === 'right' ? "mr-4" : "ml-4"
                )}>
                    {getIcon()}
                </div>
                
                <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-bold text-lg tracking-tight font-montserrat text-slate-900 dark:text-white line-clamp-2">
                        {data.label}
                    </span>
                </div>
                
                {/* Source Handle to Depth 2 */}
                <Handle 
                    type="source" 
                    position={side === 'right' ? Position.Right : Position.Left} 
                    id={`source-${side}`} 
                    className="!w-2.5 !h-2.5 !bg-indigo-400 !border-white dark:!border-slate-800" 
                />
            </motion.div>
        );
    }

    // Depth 2 Nodes
    return (
        <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
                "px-5 py-3 rounded-xl shadow-sm border transition-all hover:translate-x-1 flex items-center min-w-[160px] max-w-[300px]",
                side === 'left' ? "flex-row-reverse pr-2" : "flex-row pl-2",
                "bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-slate-100 dark:border-slate-800/50"
            )}
        >
            <Handle 
                type="target" 
                position={side === 'right' ? Position.Left : Position.Right} 
                id={side === 'right' ? 'target-left' : 'target-right'} 
                className="!w-2 !h-2 !bg-slate-400 !border-white dark:!border-slate-900" 
            />
            
            <div className={cn("w-2 h-2 rounded-full shrink-0 animate-pulse", side === 'right' ? "mr-4 bg-indigo-400" : "ml-4 bg-indigo-400")} />
            
            <span className="text-[15px] font-medium font-inter text-slate-600 dark:text-slate-300 line-clamp-3">
                {data.label}
            </span>
        </motion.div>
    );
};

interface MindMapViewerProps {
    isOpen: boolean;
    onClose: () => void;
    initialNodes: Node[];
    initialEdges: Edge[];
    onComplete?: () => void;
}

export function MindMapViewer({ isOpen, onClose, initialNodes, initialEdges, onComplete }: MindMapViewerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const handleClose = () => {
        if (onComplete) onComplete();
        onClose();
    };

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-[#0B0E14] border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
                     <div className="flex items-center justify-between w-full pr-8">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black font-montserrat tracking-tight text-slate-900 dark:text-white">Knowledge Mind Map</span>
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Interactive Semantic Graph</span>
                            </div>
                        </DialogTitle>
                        
                        <div className="flex items-center gap-2">
                             <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
                                <Share2 className="w-4 h-4" />
                             </button>
                             <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
                                <Maximize2 className="w-4 h-4" />
                             </button>
                        </div>
                     </div>
                </DialogHeader>

                <div className="flex-1 w-full h-full min-h-0 bg-[#FBFBFE] dark:bg-[#0B0E14] relative"> 
                    <AnimatePresence>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            attributionPosition="bottom-right"
                            minZoom={0.05}
                            maxZoom={2}
                            defaultEdgeOptions={{
                                type: 'smoothstep',
                                animated: true,
                                style: { strokeWidth: 2 }
                            }}
                        >
                            <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !shadow-2xl !rounded-xl !overflow-hidden" />
                            <Background 
                                variant={BackgroundVariant.Dots} 
                                color="rgba(79, 70, 229, 0.15)" 
                                gap={40} 
                                size={1} 
                            />
                            <MiniMap 
                                className="!bg-white/80 dark:!bg-slate-900/80 !backdrop-blur-md !border-slate-200 dark:!border-slate-800 !rounded-xl"
                                nodeColor={(n) => {
                                    if (n.data?.isRoot) return '#6366f1';
                                    return '#94a3b8';
                                }}
                                maskColor="rgba(0, 0, 0, 0.05)"
                            />
                        </ReactFlow>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}

