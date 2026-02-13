import { useState, useEffect } from "react";
import { Sparkles, Brain, Loader2, Plus, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDocuments } from "@/hooks/use-documents";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

export const LearningPaths = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [gaps, setGaps] = useState<any[]>([]);
    const { createDocument } = useDocuments();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.orgId) {
            fetchGaps();
        }
    }, [user?.orgId]);

    const fetchGaps = async () => {
        try {
            setIsAnalyzing(true);
            const response = await fetch(`/api/graph/analyze-gaps?orgId=${user?.orgId}`);
            if (!response.ok) throw new Error("Analysis failed");
            const text = await response.text();
            const data = text ? JSON.parse(text) : { gaps: [] };
            setGaps(data.gaps || []);
        } catch (error) {
            console.error("Failed to fetch learning paths:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const onCreateBridge = async (gap: any) => {
        try {
            const title = gap.bridgeTitle;
            const doc = await createDocument(title);
            if (doc) {
                toast.success("Learning path document created!");
                navigate(`/dashboard/documents/${doc._id}`);
            }
        } catch (error) {
            toast.error("Failed to create bridge document");
        }
    };

    if (isAnalyzing) {
        return (
            <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pl-1">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                    <span>Analyzing your Knowledge Graph...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (gaps.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <span>AI-Driven Learning Paths</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchGaps}
                    className="h-7 text-[10px] uppercase tracking-widest font-bold"
                >
                    Refresh Analysis
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {gaps.map((gap, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative h-48 rounded-2xl border bg-card p-5 hover:border-purple-500/50 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Lightbulb className="w-16 h-16 text-purple-500" />
                            </div>

                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider text-purple-500">
                                        Knowledge Bridge
                                    </div>
                                </div>
                                <h3 className="font-bold text-base leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">
                                    {gap.bridgeTitle}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                    {gap.reason}
                                </p>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => onCreateBridge(gap)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 h-9 text-xs font-semibold"
                            >
                                <Plus className="w-3 h-3" />
                                Start Learning Journey
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
