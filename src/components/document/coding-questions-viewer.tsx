import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Code2, 
    Lightbulb, 
    CheckCircle2, 
    ChevronRight, 
    ChevronDown,
    Terminal,
    Trophy,
    Sparkles,
    CircleDashed,
    Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface CodingQuestion {
    title: string;
    problem: string;
    hint: string;
    solution: string;
    difficulty: string;
}

interface CodingQuestionsViewerProps {
    isOpen: boolean;
    onClose: () => void;
    questions: CodingQuestion[] | null;
    onComplete?: (solved: number) => void;
}

export function CodingQuestionsViewer({ isOpen, onClose, questions, onComplete }: CodingQuestionsViewerProps) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
    const [showHint, setShowHint] = useState<Record<number, boolean>>({});
    const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});
    const [completed, setCompleted] = useState<Set<number>>(new Set());

    if (!questions || questions.length === 0) return null;

    const toggleHint = (idx: number) => {
        setShowHint(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleSolution = (idx: number) => {
        setShowSolution(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleCompleted = (idx: number) => {
        const next = new Set(completed);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setCompleted(next);
    };

    const progress = Math.round((completed.size / questions.length) * 100);

    const handleClose = () => {
        if (completed.size > 0 && onComplete) onComplete(completed.size);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl overflow-hidden bg-background">
                <DialogHeader className="p-8 pb-6 border-b border-border/50 bg-background/80 backdrop-blur-xl z-20 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-500/10 rounded-2xl">
                                    <Code2 className="w-6 h-6 text-rose-500" />
                                </div>
                                <DialogTitle className="text-3xl font-black font-heading tracking-tight">Logic Matrix</DialogTitle>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground ml-1.5 flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-rose-500" />
                                Synthetic environments for deep conceptual reinforcement.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                                <Trophy className="w-4 h-4 text-rose-500" />
                                <span className="text-xs font-black uppercase tracking-widest text-rose-600">
                                    {completed.size} / {questions.length} Solved
                                </span>
                            </div>
                            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-rose-500 transition-all duration-500" 
                                />
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-8 py-8 bg-[#fcfcfd] dark:bg-[#09090b]">
                    <div className="space-y-6 max-w-3xl mx-auto pb-20">
                        {questions.map((q, idx) => {
                            const isExpanded = expandedIdx === idx;
                            const isDone = completed.has(idx);

                            return (
                                <motion.div 
                                    key={idx}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={cn(
                                        "group rounded-[2rem] border-2 transition-all duration-300 overflow-hidden",
                                        isExpanded ? "border-rose-500/30 bg-white dark:bg-[#121214] shadow-xl" : "border-border/50 bg-white/50 dark:bg-[#121214]/50 hover:border-rose-500/20",
                                        isDone && !isExpanded && "opacity-60"
                                    )}
                                >
                                    <button
                                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                        className="w-full flex items-center justify-between p-6 text-left relative z-10"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                                                isDone ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-rose-500/10 group-hover:text-rose-500"
                                            )}>
                                                {isDone ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-sm font-black font-heading">{idx + 1}</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className={cn("font-black text-lg tracking-tight font-heading", isDone && "line-through text-muted-foreground")}>{q.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-[0.15em] border",
                                                        q.difficulty === 'Easy' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                                                        q.difficulty === 'Medium' ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                                        "bg-rose-500/5 text-rose-600 border-rose-500/20"
                                                    )}>
                                                        {q.difficulty}
                                                    </span>
                                                    {isDone && <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> Mastered</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-rose-500/10 transition-colors">
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-rose-500" /> : <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-rose-500" />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-8 space-y-8">
                                                    <div className="bg-muted/30 dark:bg-muted/10 rounded-2xl p-8 border border-border/50 relative overflow-hidden">
                                                        <Terminal className="absolute -bottom-4 -right-4 w-32 h-32 opacity-5 -rotate-12" />
                                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                                                            <CircleDashed className="w-4 h-4 text-rose-500 animate-spin-slow" />
                                                            Computational Protocol
                                                        </h4>
                                                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed font-medium">
                                                            <ReactMarkdown>{q.problem}</ReactMarkdown>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-11 px-6 gap-2 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border-2 border-transparent",
                                                                showHint[idx] ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "hover:bg-amber-500/5 hover:text-amber-500"
                                                            )}
                                                            onClick={() => toggleHint(idx)}
                                                        >
                                                            <Lightbulb className="w-4 h-4" />
                                                            {showHint[idx] ? "Recall Hint" : "Get a Hint"}
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-11 px-6 gap-2 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border-2 border-transparent",
                                                                showSolution[idx] ? "bg-rose-500/10 border-rose-500/20 text-rose-600" : "hover:bg-rose-500/5 hover:text-rose-500"
                                                            )}
                                                            onClick={() => toggleSolution(idx)}
                                                        >
                                                            <Code2 className="w-4 h-4" />
                                                            {showSolution[idx] ? "Hide Solution" : "Logic Trace"}
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                "h-11 px-8 gap-2 rounded-2xl ml-auto font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-none",
                                                                isDone 
                                                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20" 
                                                                    : "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20"
                                                            )}
                                                            onClick={() => toggleCompleted(idx)}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            {isDone ? "Unlock Solution" : "Confirm Logic"}
                                                        </Button>
                                                    </div>

                                                    {showHint[idx] && (
                                                        <motion.div 
                                                            initial={{ scale: 0.95, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 italic text-sm text-amber-800 dark:text-amber-200"
                                                        >
                                                            <p className="leading-relaxed">
                                                                " {q.hint} "
                                                            </p>
                                                        </motion.div>
                                                    )}

                                                    {showSolution[idx] && (
                                                        <motion.div 
                                                            initial={{ scale: 0.95, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="bg-[#09090b] dark:bg-black rounded-3xl overflow-hidden border border-rose-500/20 shadow-2xl"
                                                        >
                                                            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10">
                                                                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground">Syntactic Reference</span>
                                                            </div>
                                                            <div className="p-8">
                                                                 <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0">
                                                                    <ReactMarkdown>{q.solution}</ReactMarkdown>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </ScrollArea>
                
                <div className="p-8 border-t border-border/50 bg-background/80 backdrop-blur-xl flex justify-center z-20">
                    <Button 
                        onClick={handleClose}
                        className="rounded-2xl px-16 h-14 bg-foreground text-background font-black uppercase tracking-widest transition-all active:scale-95 border-none shadow-xl"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
