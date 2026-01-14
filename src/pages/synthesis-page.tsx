import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Sparkles, AlertTriangle, FileText, Loader2, RefreshCw, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function WorkspaceSynthesisPage() {
    const [summary, setSummary] = useState("");
    const [contradictions, setContradictions] = useState<any[]>([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isLoadingGaps, setIsLoadingGaps] = useState(false);
    const { user } = useAuth();

    const fetchSummary = async () => {
        setIsLoadingSummary(true);
        try {
            const response = await fetch("/api/ai/workspace-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId: user?.orgId || "default-org" })
            });
            const data = await response.json();
            setSummary(data.content);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const fetchContradictions = async () => {
        setIsLoadingGaps(true);
        try {
            const response = await fetch("/api/ai/detect-contradictions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId: user?.orgId || "default-org" })
            });
            const data = await response.json();
            setContradictions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingGaps(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchContradictions();
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white p-6 md:p-12 overflow-y-auto no-scrollbar">
            <div className="max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-x-3">
                            <Layers className="h-8 w-8 text-indigo-500" />
                            Workspace Synthesis
                        </h1>
                        <p className="text-muted-foreground">Global reasoning across all your documents.</p>
                    </div>
                    <Button onClick={() => { fetchSummary(); fetchContradictions(); }} variant="outline" className="gap-x-2 border-white/10 hover:bg-white/5">
                        <RefreshCw className={cn("h-4 w-4", (isLoadingSummary || isLoadingGaps) && "animate-spin")} />
                        Refresh Global View
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Summary Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-x-2">
                                <Sparkles className="h-5 w-5 text-indigo-400" />
                                Interactive Executive Summary
                            </h2>
                            
                            {isLoadingSummary ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-4 bg-white/10 rounded w-full" />
                                    <div className="h-4 bg-white/10 rounded w-5/6" />
                                    <div className="h-4 bg-white/10 rounded w-2/3" />
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                                    <ReactMarkdown>{summary || "No summary generated yet."}</ReactMarkdown>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Contradictions & Insights Sidebar */}
                    <div className="space-y-6">
                        <section className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-x-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Logic Audits
                            </h2>
                            <p className="text-xs text-muted-foreground mb-6">Factual contradictions found across documents.</p>
                            
                            <AnimatePresence>
                                {isLoadingGaps ? (
                                    <div className="py-10 flex flex-col items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Auditing workspace...</p>
                                    </div>
                                ) : contradictions.length > 0 ? (
                                    contradictions.map((c, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={i}
                                            className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-4 last:mb-0"
                                        >
                                            <div className="flex items-center gap-x-2 mb-2 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                                                <Zap className="h-3 w-3" />
                                                {c.severity} Severity
                                            </div>
                                            <p className="text-sm font-medium text-white mb-2">{c.contradiction}</p>
                                            <div className="text-[10px] text-muted-foreground bg-black/20 p-2 rounded-lg italic">
                                                Docs: {c.docs.join(", ")}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-sm">No logical conflicts detected. Your workspace is consistent.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </section>

                        <section className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                            <h2 className="text-lg font-bold mb-2 flex items-center gap-x-2">
                                <FileText className="h-5 w-5 text-indigo-400" />
                                Global Timeline
                            </h2>
                            <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                                Milestone detection and project timelines are automatically extracted and merged into your summary.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function not defined in imports
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
