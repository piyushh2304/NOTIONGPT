import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw, Brain, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardViewerProps {
    isOpen: boolean;
    onClose: () => void;
    flashcards: Flashcard[];
    onComplete?: () => void;
}

const CARD_VARIANTS = [
    "from-indigo-500/10 to-violet-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-indigo-500/5",
    "from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300 shadow-rose-500/5",
    "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/5",
    "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 shadow-amber-500/5",
    "from-blue-500/10 to-sky-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300 shadow-blue-500/5",
];

export function FlashcardViewer({ isOpen, onClose, flashcards, onComplete }: FlashcardViewerProps) {
    const [hasFlipped, setHasFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) return null;

    const handleClose = () => {
        if (hasFlipped && onComplete) onComplete();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4 shrink-0 bg-background/80 backdrop-blur-xl z-20 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-3xl font-black font-heading tracking-tight flex items-center gap-3">
                             Cognitive Retrieval
                             <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">
                                {flashcards.length} Assets
                             </span>
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Info className="w-4 h-4 text-indigo-500" />
                        <p className="text-sm font-medium">Click to flip. Active recall is 3x more effective for long-term retention.</p>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-8 py-6 bg-[#fcfcfd] dark:bg-[#09090b]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                        {flashcards.map((card, index) => (
                            <FlashcardItem 
                                key={index} 
                                card={card} 
                                index={index}
                                variantClass={CARD_VARIANTS[index % CARD_VARIANTS.length]} 
                                onFlip={() => setHasFlipped(true)}
                            />
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-xl flex justify-center">
                    <Button 
                        onClick={handleClose}
                        className="rounded-2xl px-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all border-none"
                    >
                        Complete Session
                    </Button>
                </div>
           </DialogContent>
        </Dialog>
    );
}

function FlashcardItem({ card, variantClass, onFlip, index }: { card: Flashcard, variantClass: string, onFlip: () => void, index: number }) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        if (!isFlipped) onFlip();
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="h-80 w-full perspective-1000 group cursor-pointer"
            onClick={handleFlip}
        >
            <div className={cn(
                "relative w-full h-full transition-all duration-700 transform-style-3d shadow-xl rounded-[2.5rem]",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front */}
                <div className={cn(
                    "absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border-2 bg-white dark:bg-[#121214] border-border/50 relative overflow-hidden",
                    "group-hover:border-indigo-500/30 transition-all active:scale-95"
                )}>
                    <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 blur-3xl", variantClass.split(" ")[0])} />
                    
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-indigo-500" />
                    </div>
                    
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 font-heading">Concept Query</p>
                    <h3 className="text-xl font-bold leading-snug text-foreground max-w-[90%] font-heading">
                        {card.front}
                    </h3>
                    
                    <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 group-hover:text-indigo-500/60 transition-colors uppercase tracking-widest">
                        <RotateCcw className="w-3 h-3 transition-transform group-hover:rotate-180 duration-500" />
                        Click to Reveal
                    </div>
                </div>

                {/* Back */}
                <div className={cn(
                    "absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10 text-center rounded-[2.5rem] border-2 bg-gradient-to-br border-transparent shadow-inner",
                    variantClass
                )}>
                    <CheckCircle2 className="w-8 h-8 mb-4 opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60 font-heading">Knowledge Asset</p>
                    <div className="w-full max-h-full overflow-y-auto custom-scrollbar">
                        <p className="text-lg font-bold leading-relaxed text-current font-heading">
                            {card.back}
                        </p>
                    </div>
                    
                    <div className="absolute bottom-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                        Concept Mastered?
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
