import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, FileQuestion, HelpCircle, Sparkles, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
    question: string;
    options: string[];
    answer: string;
}

interface QuizViewerProps {
    isOpen: boolean;
    onClose: () => void;
    questions: Question[];
    onComplete?: (score: number) => void;
}

export function QuizViewer({ isOpen, onClose, questions, onComplete }: QuizViewerProps) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    if (!questions || questions.length === 0) return null;

    const handleOptionSelect = (qIndex: number, option: string) => {
        if (showResults) return; 
        setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.answer) score++;
        });
        return score;
    };

    const resetQuiz = () => {
        setSelectedAnswers({});
        setShowResults(false);
    };

    const score = calculateScore();
    const isPerfect = score === questions.length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-background border-none shadow-2xl overflow-hidden">
                <DialogHeader className="p-8 pb-6 bg-background/80 backdrop-blur-xl border-b border-border/50 z-20 shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
                                    <FileQuestion className="w-6 h-6 text-indigo-500" />
                                </div>
                                <span className="text-3xl font-black font-heading tracking-tight">Cognitive Check</span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground ml-1.5 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Test your retention of the current knowledge module.
                            </p>
                        </div>
                        
                        <AnimatePresence>
                            {showResults && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "flex flex-col items-end px-6 py-3 rounded-2xl border-2 shadow-lg",
                                        isPerfect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-indigo-500/5 border-indigo-500/20 text-indigo-600"
                                    )}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Retrieval Score</span>
                                    <span className="text-2xl font-black font-heading">{score} / {questions.length}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 px-8 py-8 bg-[#fcfcfd] dark:bg-[#09090b]">
                    <div className="space-y-12 max-w-2xl mx-auto pb-16">
                        {questions.map((q, qIdx) => {
                            const isCorrect = selectedAnswers[qIdx] === q.answer;
                            
                            return (
                                <motion.div 
                                    key={qIdx} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: qIdx * 0.1 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-2xl font-black text-indigo-500/20 font-heading shrink-0 mt-0.5">{String(qIdx + 1).padStart(2, '0')}</span>
                                        <h3 className="text-xl font-bold leading-snug font-heading text-foreground pt-1">
                                            {q.question}
                                        </h3>
                                    </div>
                                    
                                    <div className="grid gap-3 ml-10">
                                        {q.options.map((option, oIdx) => {
                                            const isSelected = selectedAnswers[qIdx] === option;
                                            const isAnswer = q.answer === option;
                                            
                                            let optionClass = "bg-white dark:bg-[#121214] border-border/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-muted-foreground"; 
                                            
                                            if (showResults) {
                                                if (isAnswer) optionClass = "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/10";
                                                else if (isSelected && !isCorrect) optionClass = "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400";
                                                else optionClass = "opacity-40 border-border/20 grayscale"; 
                                            } else {
                                                if (isSelected) optionClass = "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/30";
                                            }

                                            return (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleOptionSelect(qIdx, option)}
                                                    className={cn(
                                                        "w-full text-left p-5 rounded-[1.25rem] border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                                                        optionClass
                                                    )}
                                                    disabled={showResults}
                                                >
                                                    <span className="flex items-center gap-4 relative z-10">
                                                        <span className={cn(
                                                            "w-7 h-7 rounded-xl border-2 flex items-center justify-center text-[10px] font-black shrink-0 transition-all",
                                                            isSelected ? "border-white/20 bg-white/20 text-white" : "border-muted-foreground/20 text-muted-foreground/60"
                                                        )}>
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </span>
                                                        <span className="font-bold text-sm tracking-tight">{option}</span>
                                                    </span>
                                                    
                                                    {showResults && isAnswer && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative z-10">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        </motion.div>
                                                    )}
                                                    {showResults && isSelected && !isCorrect && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative z-10">
                                                            <XCircle className="w-5 h-5 text-rose-500" />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="p-8 border-t border-border/50 bg-background/80 backdrop-blur-xl flex justify-center gap-4 z-20">
                    {!showResults ? (
                         <Button 
                            onClick={() => {
                                setShowResults(true);
                                if (onComplete) onComplete(calculateScore());
                            }} 
                            disabled={Object.keys(selectedAnswers).length < questions.length}
                            className="rounded-2xl px-16 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all border-none gap-3 active:scale-95 disabled:grayscale"
                        >
                            Finalize Quiz
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <div className="flex items-center gap-4 w-full justify-center">
                            <Button onClick={resetQuiz} variant="secondary" className="rounded-2xl px-10 h-14 font-bold border-border/50 border shadow-sm active:scale-95">
                                Try Again
                            </Button>
                            <Button onClick={onClose} className="rounded-2xl px-12 h-14 bg-foreground text-background font-black uppercase tracking-widest active:scale-95 border-none">
                                Finish Module
                                <Trophy className="ml-2 w-4 h-4 text-amber-500 fill-current" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
