import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Search, Sparkles, Loader2, ArrowRight, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [isAnalogyMode, setIsAnalogyMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [extractedConcept, setExtractedConcept] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const endpoint = isAnalogyMode ? "/api/ai/analogy-search" : "/api/documents/search";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    query,
                    orgId: user?.orgId || "default-org"
                })
            });
            
            const data = await response.json();
            
            if (isAnalogyMode) {
                setResults(data.results || []);
                setExtractedConcept(data.extractedConcept);
            } else {
                setResults(Array.isArray(data) ? data : []);
                setExtractedConcept("");
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white p-6 md:p-12 overflow-y-auto no-scrollbar">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto w-full mb-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-x-2 mb-4"
                >
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Search className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold font-heading">Semantic Search</h1>
                </motion.div>
                
                <p className="text-muted-foreground mb-8 max-w-2xl">
                    Search across your entire knowledge base using natural language or abstract analogies. 
                    AIODocs understands the concepts behind your notes.
                </p>

                {/* Search Box */}
                <form 
                    onSubmit={handleSearch}
                    className="relative group mb-4"
                >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <Input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isAnalogyMode ? "Search by analogy (e.g., 'patterns like a factory line')..." : "Search documents..."}
                        className="pl-12 pr-32 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center gap-x-2">
                        <Button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </form>

                {/* Toggles */}
                <div className="flex items-center gap-x-4">
                    <button 
                        onClick={() => setIsAnalogyMode(true)}
                        className={cn(
                            "flex items-center gap-x-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            isAnalogyMode ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Analogy Mode
                    </button>
                    <button 
                        onClick={() => setIsAnalogyMode(false)}
                        className={cn(
                            "flex items-center gap-x-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                            !isAnalogyMode ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Direct Search
                    </button>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                            <p className="text-muted-foreground animate-pulse">
                                {isAnalogyMode ? "Extracting abstract concepts..." : "Searching documents..."}
                            </p>
                        </motion.div>
                    ) : results.length > 0 ? (
                        <motion.div 
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {extractedConcept && (
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl mb-8">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">AI Interpretation</p>
                                    <p className="text-lg text-white font-medium italic">"{extractedConcept}"</p>
                                </div>
                            )}

                            {results.map((result, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={result.id || idx}
                                    onClick={() => navigate(`/dashboard/documents/${result.id}`)}
                                    className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{result.title}</h3>
                                    
                                    {result.reasoning && (
                                        <div className="flex gap-x-3">
                                            <div className="mt-1 shrink-0">
                                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {result.reasoning}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (results.length === 0 && !isLoading && query) ? (
                        <motion.div 
                            key="no-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <p className="text-muted-foreground text-lg">No documents found matching this concept.</p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}
