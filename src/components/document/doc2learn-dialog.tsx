import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, FileQuestion, Layers, Calendar, Code, Sparkles, Loader2 } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { generateMindMapData } from "@/lib/mind-map-utils";

interface Doc2LearnDialogProps {
    documentId: string;
    documentContent: string;
    children: React.ReactNode;
    onFlashcardsGenerated?: (cards: any[]) => void;
    onMindMapGenerated?: (data: any) => void;
    onQuizGenerated?: (data: any[]) => void;
    onStudyPlanGenerated?: (data: any) => void;
    onCodingQuestionsGenerated?: (data: any[]) => void;
    defaultType?: string;
    hasFlashcards?: boolean;
    hasMindMap?: boolean;
    hasQuiz?: boolean;
    hasStudyPlan?: boolean;
    hasCodingQuestions?: boolean;
    onViewFlashcards?: () => void;
    onViewMindMap?: () => void;
    onViewQuiz?: () => void;
    onViewStudyPlan?: () => void;
    onViewCodingQuestions?: () => void;
}

export const Doc2LearnDialog = ({ 
    documentId, 
    documentContent, 
    children, 
    onFlashcardsGenerated,
    onMindMapGenerated,
    onQuizGenerated,
    onStudyPlanGenerated,
    onCodingQuestionsGenerated,
    defaultType = "quiz",
    onViewFlashcards,
    onViewMindMap,
    onViewQuiz,
    onViewStudyPlan,
    onViewCodingQuestions,
    hasFlashcards,
    hasMindMap,
    hasQuiz,
    hasStudyPlan,
    hasCodingQuestions
}: Doc2LearnDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const { createDocument, updateDocument } = useDocuments();
    const navigate = useNavigate();

    const handleGenerate = async (type: string, prompt?: string) => {
        try {
            setIsLoading(true);
            
            // 1. Call API
            const response = await fetch('/api/ai/generate-learning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    documentContent, 
                    type, 
                    customPrompt: prompt 
                })
            });

            if (!response.ok) {
                let errorMessage = "Failed to generate content";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Ignore JSON parse error
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Special handling for Structured Data (Flashcards, MindMap, Quiz, Study Plan, Coding Questions)
            // Save to current document meta instead of new doc
            const structuredTypes = ['flashcards', 'mindmap', 'quiz', 'plan', 'coding'];
            
            if (structuredTypes.includes(type)) {
                let parsedData;
                try {
                    let contentToParse = data.content;
                    if (typeof contentToParse === 'string') {
                        // 1. Initial Cleanup: Remove markdown and excessive whitespace
                        contentToParse = contentToParse.replace(/```json\n?|```/g, '').trim();

                        // 2. Extract JSON structure (handle cases where AI adds preamble)
                        const firstBracket = contentToParse.indexOf('[');
                        const firstBrace = contentToParse.indexOf('{');
                        const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;
                        
                        const lastBracket = contentToParse.lastIndexOf(']');
                        const lastBrace = contentToParse.lastIndexOf('}');
                        const end = Math.max(lastBracket, lastBrace);

                        if (start !== -1 && end !== -1 && end > start) {
                            contentToParse = contentToParse.substring(start, end + 1);
                        }

                        // 3. Robust Repair: Handle unescaped newlines inside string values
                        // This identifies content between double quotes and replaces literal newlines with \n
                        contentToParse = contentToParse.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match: string) => {
                            return match.replace(/\r?\n/g, '\\n');
                        });

                        // 4. Sanitize trailing commas (common AI mistake)
                        contentToParse = contentToParse.replace(/,(\s*[\]}])/g, '$1');

                        parsedData = JSON.parse(contentToParse);
                    } else {
                        parsedData = contentToParse;
                    }
                } catch (e) {
                    console.error(`Failed to parse ${type} JSON. Content:`, data.content, e);
                    throw new Error(`AI generated invalid ${type} format. Please try again.`);
                }

                const updates: any = {};
                if (type === 'flashcards') {
                    updates.flashcards = parsedData;
                    if (onFlashcardsGenerated) onFlashcardsGenerated(parsedData);
                    toast.success("Flashcards generated! Click 'Review' to view.");
                } else if (type === 'mindmap') {
                    // Special transform for Mind Map using utility
                    try {
                        const { nodes, edges } = generateMindMapData(parsedData);
                        const mindMapData = {
                            initialNodes: nodes,
                            initialEdges: edges
                        };
                        updates.mindmap = mindMapData;
                        if (onMindMapGenerated) onMindMapGenerated(mindMapData);
                        toast.success("Mind Map generated! Click 'View' to open.");
                    } catch (layoutError) {
                        console.error("Mind map layout failed:", layoutError);
                        throw new Error("Failed to generate mind map layout");
                    }
                } else if (type === 'quiz') {
                    updates.quiz = parsedData;
                    if (onQuizGenerated) onQuizGenerated(parsedData);
                    toast.success("Quiz generated! Click 'Start Quiz' to begin.");
                } else if (type === 'plan') {
                    updates.studyPlan = parsedData;
                    if (onStudyPlanGenerated) onStudyPlanGenerated(parsedData);
                    toast.success("Study Plan generated! Click 'View Plan' to open.");
                } else if (type === 'coding') {
                    updates.codingQuestions = parsedData;
                    if (onCodingQuestionsGenerated) onCodingQuestionsGenerated(parsedData);
                    toast.success("Coding Questions generated! Click 'Practice' to view.");
                }

                await updateDocument(documentId, updates);
                setOpen(false);
                return;
            }

            // 2. Create New Document (for other types)
            const titlePrefix = prompt ? "AI Custom: " : `Doc2Learn: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const title = `${titlePrefix} - ${new Date().toLocaleTimeString()}`;
            
            const newDoc = await createDocument(title);

            if (newDoc) {
                // 3. Update with content
                const contentJson = {
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: data.content
                                }
                            ]
                        }
                    ]
                };

                await updateDocument(newDoc._id, { content: JSON.stringify(contentJson) });
                
                toast.success("Learning content generated!");
                setOpen(false);
                navigate(`/dashboard/documents/${newDoc._id}`);
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to generate content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const presets = [
        { id: 'quiz', label: hasQuiz ? 'Start Quiz' : 'MCQ Quiz', icon: FileQuestion, color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: 'flashcards', label: hasFlashcards ? 'Review Flashcards' : 'Flashcards', icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: 'mindmap', label: hasMindMap ? 'View Mind Map' : 'Mind Map', icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
        { id: 'plan', label: hasStudyPlan ? 'View Plan' : 'Study Plan', icon: Calendar, color: "text-green-500", bg: "bg-green-500/10" },
        { id: 'coding', label: hasCodingQuestions ? 'Practice Qs' : 'Coding Qs', icon: Code, color: "text-pink-500", bg: "bg-pink-500/10" },
    ];

    const handlePresetClick = (preset: any) => {
        if (preset.id === 'flashcards' && hasFlashcards && onViewFlashcards) {
            setOpen(false);
            onViewFlashcards();
            return;
        }
        if (preset.id === 'mindmap' && hasMindMap && onViewMindMap) {
            setOpen(false);
            onViewMindMap();
            return;
        }
        if (preset.id === 'quiz' && hasQuiz && onViewQuiz) {
            setOpen(false);
            onViewQuiz();
            return;
        }
        if (preset.id === 'plan' && hasStudyPlan && onViewStudyPlan) {
            setOpen(false);
            onViewStudyPlan();
            return;
        }
        if (preset.id === 'coding' && hasCodingQuestions && onViewCodingQuestions) {
            setOpen(false);
            onViewCodingQuestions();
            return;
        }
        handleGenerate(preset.id);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Doc2Learn AI
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground mt-2">
                        Generate learning materials like Quizzes, Flashcards, and Mind Maps from your document.
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        {presets.map((preset) => (
                            <Button
                                key={preset.id}
                                variant="outline"
                                className={`h-20 flex flex-col gap-2 items-center justify-center border-2 hover:border-primary/50 hover:bg-muted/50 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                            >
                                <div className={`p-2 rounded-full ${preset.bg}`}>
                                    <preset.icon className={`w-5 h-5 ${preset.color}`} />
                                </div>
                                <span className="font-medium">{preset.label}</span>
                            </Button>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or tell AI what to do
                            </span>
                        </div>
                    </div>

                    <div className="flex bg-muted/30 p-1 rounded-lg border focus-within:ring-2 ring-ring/20 transition-all">
                        <Input 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. 'Summarize this in 3 bullet points'..." 
                            className="border-0 bg-transparent focus-visible:ring-0 shadow-none flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customPrompt && !isLoading) {
                                    handleGenerate('custom', customPrompt);
                                }
                            }}
                        />
                        <Button 
                            size="sm" 
                            disabled={!customPrompt || isLoading}
                            onClick={() => handleGenerate('custom', customPrompt)}
                            className="shrink-0"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
