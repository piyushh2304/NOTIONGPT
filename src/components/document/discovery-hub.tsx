import { useState } from "react";
import { Sparkles, ArrowRight, Brain, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDocuments } from "@/hooks/use-documents";
import { useNavigate } from "react-router-dom";

export const DiscoveryHub = ({ orgId }: { orgId: string }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [gaps, setGaps] = useState<any[]>([]);
    const { createDocument } = useDocuments();
    const navigate = useNavigate();

    const onAnalyze = async () => {
        try {
            setIsAnalyzing(true);
            const response = await fetch(`/api/graph/analyze-gaps?orgId=${orgId}`);
            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setGaps(data.gaps || []);
            if (data.gaps?.length === 0) {
                toast.info("No major knowledge gaps detected. Your graph is well connected!");
            }
        } catch (error) {
            toast.error("Failed to analyze knowledge graph");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const onCreateBridge = async (gap: any) => {
        try {
            const title = gap.bridgeTitle;
            const doc = await createDocument(title);
            if (doc) {
                toast.success("Bridge document created!");
                navigate(`/dashboard/documents/${doc._id}`);
            }
        } catch (error) {
            toast.error("Failed to create bridge document");
        }
    };

    return (
        <div className="absolute top-8 right-8 z-50 w-80">
            <div className="bg-background/80 backdrop-blur-md border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[70vh]">
                <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-sm">Discovery Hub</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        className="h-8 text-xs gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                        Analyze
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {isAnalyzing && (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            <p className="text-xs text-muted-foreground animate-pulse font-medium">
                                Running topographical graph analysis...
                            </p>
                        </div>
                    )}

                    {!isAnalyzing && gaps.length === 0 && (
                        <div className="py-8 text-center">
                            <Brain className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
                            <p className="text-xs text-muted-foreground">
                                Click "Analyze" to uncover hidden <br /> connections in your workspace.
                            </p>
                        </div>
                    )}

                    <AnimatePresence>
                        {gaps.map((gap, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group p-3 border rounded-xl bg-card hover:border-purple-500/50 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                                        Knowledge Gap detected
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold mb-1 group-hover:text-purple-600 transition-colors">
                                    {gap.bridgeTitle}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                                    {gap.reason}
                                </p>
                                <Button 
                                    size="sm" 
                                    className="w-full h-8 bg-purple-500 hover:bg-purple-600 text-xs gap-2 rounded-lg"
                                    onClick={() => onCreateBridge(gap)}
                                >
                                    <Plus className="w-3 h-3" />
                                    Build Bridge
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
