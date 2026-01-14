import { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Brain, Maximize2, ZoomIn, ZoomOut, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { DiscoveryHub } from "@/components/document/discovery-hub";

export default function GraphPage(){
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Responsive scaling
    useEffect(() => {
        if (!containerRef.current) return;
        
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!user?.orgId) return;

        fetch(`/api/graph/data?orgId=${user.orgId}`)
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
                    setGraphData(data);
                    // Initial fit
                    setTimeout(() => {
                        fgRef.current?.zoomToFit(400, 100);
                    }, 500);
                } else {
                    console.error("Invalid graph data received:", data);
                }
            });
    }, [user?.orgId]);

    return (
        <div ref={containerRef} className="h-full flex-1 bg-[#fdfdfd] dark:bg-[#0b0b0b] relative overflow-hidden">
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                    <Brain className="w-8 h-8 text-purple-500" />
                    Knowledge Graph
                </h1>
                <p className="text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full w-fit border shadow-sm">
                    {graphData?.nodes?.length || 0} Documents Connected
                </p>
            </div>

            {user?.orgId && <DiscoveryHub orgId={user.orgId} />}
            
            <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
                <Button size="icon" variant="secondary" className="rounded-xl shadow-lg border" onClick={() => fgRef.current.zoom(fgRef.current.zoom() * 1.5)}>
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="rounded-xl shadow-lg border" onClick={() => fgRef.current.zoom(fgRef.current.zoom() * 0.7)}>
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="rounded-xl shadow-lg border" onClick={() => fgRef.current.zoomToFit(400)}>
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>

            {dimensions.width > 0 && (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeRelSize={6}
                    linkColor={() => "rgba(148, 163, 184, 0.2)"}
                    linkDirectionalParticles={1}
                    linkDirectionalParticleSpeed={0.005}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = `${node.icon} ${node.name}`;
                        const fontSize = 12 / globalScale;
                        const mastery = node.mastery || 0;
                        
                        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.6);
                        
                        // Capsule properties
                        const x = node.x - bckgDimensions[0] / 2;
                        const y = node.y - bckgDimensions[1] / 2;
                        const w = bckgDimensions[0];
                        const h = bckgDimensions[1];
                        const r = h / 2;

                        // Background shadow
                        ctx.shadowColor = mastery >= 4 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(0,0,0,0.15)';
                        ctx.shadowBlur = 12 / globalScale;

                        // Capsule background
                        const isDark = document.documentElement.classList.contains('dark');
                        if (mastery >= 4) {
                            ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)';
                        } else {
                            ctx.fillStyle = isDark ? '#1a1a1a' : '#ffffff';
                        }

                        ctx.beginPath();
                        ctx.roundRect(x, y, w, h, r);
                        ctx.fill();
                        
                        // Border
                        ctx.strokeStyle = mastery >= 4 ? '#8b5cf6' : mastery >= 2 ? '#6366f1' : (isDark ? '#333' : '#e2e8f0');
                        ctx.lineWidth = 1.5 / globalScale;
                        ctx.stroke();

                        ctx.shadowBlur = 0; // Reset shadow

                        // Text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = mastery >= 4 ? (isDark ? '#a78bfa' : '#7c3aed') : (isDark ? '#e5e7eb' : '#1f2937');
                        ctx.fillText(label, node.x, node.y);
                        
                        // Cache for click detection
                        node.__bckgDimensions = bckgDimensions;
                    }}
                    nodePointerAreaPaint={(node: any, color, ctx) => {
                        const bckgDimensions = node.__bckgDimensions;
                        if (bckgDimensions) {
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], bckgDimensions[1] / 2);
                            ctx.fill();
                        }
                    }}
                    onNodeClick={(node: any) => navigate(`/dashboard/documents/${node.id}`)}
                    backgroundColor="transparent"
                />
            )}
        </div>
    );
}
