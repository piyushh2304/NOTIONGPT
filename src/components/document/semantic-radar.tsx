import { useState, useEffect } from "react";
import { Radar, Sparkles, Plus, ExternalLink, Brain, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Suggestion {
    id: string;
    title: string;
    score: number;
    text: string;
}

interface SemanticRadarProps {
    content: string;
    currentDocId: string;
    onInsertLink?: (docId: string, title: string) => void;
}

export function SemanticRadar({ content, currentDocId, onInsertLink }: SemanticRadarProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isCollapsed || !content || content.length < 50) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/graph/suggest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: content, currentDocId }),
                });
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 1000);
        return () => clearTimeout(timer);
    }, [content, currentDocId, isCollapsed]);

    return (
        <motion.div 
            animate={{ width: isCollapsed ? 48 : 320 }}
            className="border-l bg-card flex flex-col h-full overflow-hidden relative"
        >
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute right-2 top-4 z-50 h-8 w-8 rounded-full hover:bg-purple-50 hover:text-purple-600 transition-colors"
            >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
            </Button>

            {!isCollapsed && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full w-[320px]"
                >
                    <div className="p-4 border-b bg-muted/30 pr-12">
                        <div className="flex items-center gap-2 mb-1">
                            <Radar className="w-4 h-4 text-purple-500 animate-pulse" />
                            <h2 className="font-semibold text-sm flex items-center gap-2">
                                Semantic Radar
                                <Sparkles className="w-3 h-3 text-amber-500" />
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            Proactively discovering connections...
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-4 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {isLoading && suggestions.length === 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-3"
                                    >
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                                        ))}
                                    </motion.div>
                                )}

                                {!isLoading && suggestions.length === 0 && content.length >= 50 && (
                                    <div className="text-center py-8">
                                        <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Keep writing to find connections</p>
                                    </div>
                                )}

                                {suggestions.map((s) => (
                                    <motion.div
                                        key={s.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group relative p-3 rounded-xl border bg-background hover:border-purple-200 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-sm line-clamp-1">{s.title || "Untitled"}</h3>
                                            <div className="px-1.5 py-0.5 rounded bg-purple-50 text-[10px] font-bold text-purple-600">
                                                {Math.round(s.score * 100)}%
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                                            {s.text}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-7 text-[10px] gap-1 px-2 hover:bg-purple-50 hover:text-purple-600"
                                                onClick={() => onInsertLink?.(s.id, s.title)}
                                            >
                                                <Plus className="w-3 h-3" />
                                                Insert Link
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-7 text-[10px] gap-1 px-2 hover:bg-muted"
                                                onClick={() => navigate(`/dashboard/documents/${s.id}`)}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Open
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/10 border-t">
                        <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                            <span>Powered by Vector Search</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                <span className="sr-only">System Active</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {isCollapsed && (
                <div className="flex flex-col items-center py-16 gap-4">
                    <Radar className="w-5 h-5 text-purple-500 animate-pulse" />
                    <div className="[writing-mode:vertical-lr] text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-50">
                        Semantic Radar
                    </div>
                </div>
            )}
        </motion.div>
    );
}
