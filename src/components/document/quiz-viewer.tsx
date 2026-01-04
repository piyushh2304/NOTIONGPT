import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, FileQuestion, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
    question: string;
    options: string[];
    answer: string;
}

interface QuizViewerProps {
    isOpen: boolean;
    onClose: () => void;
    questions: Question[];
}

export function QuizViewer({ isOpen, onClose, questions }: QuizViewerProps) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    if (!questions || questions.length === 0) return null;

    const handleOptionSelect = (qIndex: number, option: string) => {
        if (showResults) return; // Prevent changing after submit
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 bg-slate-50 dark:bg-slate-900">
                <DialogHeader className="p-6 pb-4 bg-background border-b z-10">
                    <DialogTitle className="flex items-center justify-between text-2xl">
                        <div className="flex items-center gap-2">
                            <FileQuestion className="w-6 h-6 text-orange-500" />
                            <span>Knowledge Check</span>
                        </div>
                        {showResults && (
                            <div className="text-lg font-medium px-4 py-1 bg-primary/10 rounded-full text-primary">
                                Score: {calculateScore()} / {questions.length}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8 max-w-2xl mx-auto pb-10">
                        {questions.map((q, qIdx) => {
                            const isCorrect = selectedAnswers[qIdx] === q.answer;
                            const isWrong = selectedAnswers[qIdx] && selectedAnswers[qIdx] !== q.answer;
                            
                            return (
                                <div key={qIdx} className="space-y-4">
                                    <h3 className="text-lg font-medium leading-normal">
                                        <span className="text-muted-foreground mr-2">{qIdx + 1}.</span>
                                        {q.question}
                                    </h3>
                                    
                                    <div className="grid gap-3">
                                        {q.options.map((option, oIdx) => {
                                            const isSelected = selectedAnswers[qIdx] === option;
                                            const isAnswer = q.answer === option;
                                            
                                            let optionClass = "hover:bg-accent hover:text-accent-foreground border-muted"; // default
                                            
                                            if (showResults) {
                                                if (isAnswer) optionClass = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300";
                                                else if (isSelected && !isCorrect) optionClass = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300";
                                                else optionClass = "opacity-50"; 
                                            } else {
                                                if (isSelected) optionClass = "border-primary bg-primary/5 shadow-sm ring-1 ring-primary";
                                            }

                                            return (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleOptionSelect(qIdx, option)}
                                                    className={cn(
                                                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group",
                                                        optionClass
                                                    )}
                                                    disabled={showResults}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0",
                                                            isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                                                        )}>
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </span>
                                                        <span>{option}</span>
                                                    </span>
                                                    
                                                    {showResults && isAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                                    {showResults && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background flex justify-end gap-2">
                    {!showResults ? (
                         <Button 
                            onClick={() => setShowResults(true)} 
                            disabled={Object.keys(selectedAnswers).length < questions.length}
                            className="w-full sm:w-auto"
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button onClick={resetQuiz} variant="outline" className="w-full sm:w-auto">
                            Retake Quiz
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
