import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardViewerProps {
    isOpen: boolean;
    onClose: () => void;
    flashcards: Flashcard[];
}

const CARD_COLORS = [
    "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    "bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    "bg-teal-100 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
    "bg-cyan-100 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
    "bg-sky-100 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
    "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    "bg-indigo-100 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    "bg-violet-100 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
    "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    "bg-fuchsia-100 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800",
    "bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
    "bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
];

export function FlashcardViewer({ isOpen, onClose, flashcards }: FlashcardViewerProps) {
    if (!flashcards || flashcards.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-muted/30">
                <DialogHeader className="p-6 pb-2 shrink-0 bg-background/80 backdrop-blur-sm z-10 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                             📚 Review Flashcards
                             <span className="text-sm font-normal text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded-full">
                                {flashcards.length} cards
                             </span>
                        </DialogTitle>
                        {/* Close button is handled by DialogPrimitive but adding a custom action if needed */}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Click on a card to flip it. Review your concepts efficiently.
                    </p>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        {flashcards.map((card, index) => (
                            <FlashcardItem 
                                key={index} 
                                card={card} 
                                colorClass={CARD_COLORS[index % CARD_COLORS.length]} 
                            />
                        ))}
                    </div>
                </ScrollArea>
           </DialogContent>
        </Dialog>
    );
}

function FlashcardItem({ card, colorClass }: { card: Flashcard, colorClass: string }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div 
            className="h-64 w-full perspective-1000 group cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={cn(
                "relative w-full h-full transition-all duration-500 transform-style-3d shadow-sm hover:shadow-md rounded-xl",
                isFlipped ? "rotate-y-180" : ""
            )}>
                {/* Front */}
                <div className={cn(
                    "absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center rounded-xl border-2",
                    "bg-background", // Keep front generic or lightly colored? User asked for colorful.
                    colorClass // Apply color to the front
                )}>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-4">Question</p>
                    <h3 className="text-xl font-medium leading-relaxed font-serif">
                        {card.front}
                    </h3>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-50 transition-opacity">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                </div>

                {/* Back */}
                <div className={cn(
                    "absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center rounded-xl border-2",
                    "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" // Back is neutral for readability or maybe consistent?
                )}>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-4 text-primary">Answer</p>
                    <div className="prose dark:prose-invert prose-sm max-h-full overflow-y-auto w-full">
                        <p className="text-lg leading-relaxed">{card.back}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
