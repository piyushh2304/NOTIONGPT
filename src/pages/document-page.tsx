
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { useDocuments, type Document } from '@/hooks/use-documents';
import Editor from '@/components/editor/editor';
import { Toolbar } from '@/components/document/toolbar';
import { Cover } from '@/components/document/cover';
import { format } from 'date-fns';
import { Star, MoreHorizontal, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SharePopover } from '@/components/document/share-popover';
import { FlashcardViewer } from '@/components/document/flashcard-viewer';
import { MindMapViewer } from '@/components/document/mind-map-viewer';
import { QuizViewer } from '@/components/document/quiz-viewer';
import { StudyPlanViewer } from '@/components/document/study-plan-viewer';
import { CodingQuestionsViewer } from '@/components/document/coding-questions-viewer';
import { SemanticRadar } from '@/components/document/semantic-radar';
import { toast } from 'sonner';

export default function DocumentPage() {
    const params = useParams();
    const navigate = useNavigate();
    const { getDocument, updateDocument, createDocument } = useDocuments();
    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [showMindMap, setShowMindMap] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [showStudyPlan, setShowStudyPlan] = useState(false);
    const [showCodingQuestions, setShowCodingQuestions] = useState(false);
    const titleTimeoutRef = useRef<any>(null);

    const documentId = params.documentId;

    useEffect(() => {
        const loadDocument = async () => {
            if (!documentId) return;
            setIsLoading(true);
            const doc = await getDocument(documentId);
            setDocument(doc);
            setIsLoading(false);
        };
        loadDocument();
    }, [documentId]);

    const onChange = async (content: string) => {
        if (!documentId) return;
        setDocument(prev => prev ? { ...prev, content } : null);
        // Debounce would be here
        await updateDocument(documentId, { content });
    };

    const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newTitle = e.target.value;
        if (!documentId) return;
        
        // 1. Immediate local state update for snappy UI
        setDocument(prev => prev ? { ...prev, title: newTitle } : null);

        // 2. Debounced backend update
        if (titleTimeoutRef.current) {
            clearTimeout(titleTimeoutRef.current);
        }

        titleTimeoutRef.current = setTimeout(async () => {
            try {
                await updateDocument(documentId, { title: newTitle });
                
                // 3. Optional: Trigger a custom event to refresh the sidebar if needed
                // The sidebar currently refetches on mount/change, 
                // but we can add a simple event dispatcher for real-time sync.
                window.dispatchEvent(new CustomEvent('document-updated', { 
                    detail: { id: documentId, title: newTitle } 
                }));
            } catch (err) {
                console.error("Failed to update title:", err);
            }
        }, 700);
    };

    const handleReviewComplete = async (score?: number, total?: number) => {
        if (!document) return;
        
        let finalScore = 3; // Default to "medium/pass" if no score provided
        if (score !== undefined && total !== undefined) {
             const percentage = score / total;
             if (percentage > 0.8) finalScore = 5;
             else if (percentage > 0.5) finalScore = 4;
             else if (percentage > 0.3) finalScore = 3;
             else if (percentage > 0.1) finalScore = 2;
             else finalScore = 1;
        }

        try {
            const response = await fetch(`/api/reviews/${document._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score: finalScore })
            });

            if (response.ok) {
                const data = await response.json();
                setDocument(prev => prev ? { 
                    ...prev, 
                    masteryLevel: data.masteryLevel, 
                    nextReviewAt: data.nextReviewAt,
                    lastReviewedAt: new Date().toISOString()
                } : null);
            }
        } catch (error) {
            console.error("Failed to record review:", error);
        }

        // Track user activity
        try {
            await fetch("/api/auth/activity", { method: "POST" });
        } catch (e) {
            console.error("Failed to track activity", e);
        }
    };

    const handleInsertLink = (docId: string, title: string) => {
        // This is a simplified version. In a real Tiptap integration, 
        // we'd use the editor instance to insert a link.
        // For now, we'll toast the user or just provide the logic placeholder.
        const editor = window.document.querySelector('.ProseMirror') as any;
        if (editor?.[Object.keys(editor).find(k => k.startsWith('__reactProps')) as string]?.children?.props?.editor) {
            const tiptap = editor[Object.keys(editor).find(k => k.startsWith('__reactProps')) as string].children.props.editor;
            tiptap.chain().focus().extendMarkRange('link').insertContent(` <a href="/dashboard/documents/${docId}" class="text-purple-600 underline font-medium">${title}</a> `).run();
            toast.success("Link inserted!");
        } else {
            toast.info("Click the editor first to insert a link!");
        }
    };

    const onResearch = async () => {
        if (!document) return;
        
        const query = document.title || "Latest trends in AI";
        
        toast.promise(
            (async () => {
                const response = await fetch('/api/research', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, orgId: document.orgId })
                });

                if (!response.ok) throw new Error("Research failed");
                const data = await response.json();

                // Create a new document for the research
                const newTitle = `Research: ${query}`;
                const newDoc = await createDocument(newTitle);

                if (newDoc) {
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
                    navigate(`/dashboard/documents/${newDoc._id}`);
                    return data;
                } else {
                    throw new Error("Failed to create new research document");
                }
            })(),
            {
                loading: 'Research Agent is scouring the web...',
                success: 'Research complete! New document created.',
                error: (err: any) => err.message || 'Research failed. Check your API keys.',
            }
        );
    };

    if (isLoading) {
        return (
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
                <div className="space-y-4 pl-8 pt-4">
                    <div className="h-14 w-[50%] bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-[80%] bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-[40%] bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-[60%] bg-muted rounded-md animate-pulse" />
                </div>
            </div>
        );
    }

    if (!document) {
        return <div>Not found</div>;
    }

    return (
        <div key={documentId} className="h-full flex overflow-hidden group">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-40 relative">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-1 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs mr-2 text-muted-foreground">
                        Edited {document.updatedAt ? format(new Date(document.updatedAt), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                    </span>
                    
                    <SharePopover 
                        documentId={documentId!} 
                        isPublic={document?.isPublic || false} 
                        allowedUsers={document?.allowedUsers || []} 
                        trigger={
                            <Button variant="ghost" size="sm" className="h-8 gap-1 font-normal">
                                Share
                            </Button>
                        } 
                    />

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setIsFavorite(!isFavorite)}
                    >
                        <Star size={18} className={isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={18} />
                    </Button>
                </div>

                <Cover 
                    url={document.coverImage} 
                    onRemove={() => setDocument(doc => doc ? { ...doc, coverImage: "" } : null)}
                    onChange={(url) => setDocument(doc => doc ? { ...doc, coverImage: url } : null)}
                />

                {/* Viewers */}
                <FlashcardViewer 
                    isOpen={showFlashcards} 
                    onClose={() => setShowFlashcards(false)} 
                    flashcards={document.flashcards || []} 
                    onComplete={() => handleReviewComplete()}
                />
                <MindMapViewer 
                    isOpen={showMindMap}
                    onClose={() => setShowMindMap(false)}
                    initialNodes={document.mindmap?.initialNodes || []}
                    initialEdges={document.mindmap?.initialEdges || []}
                    onComplete={() => handleReviewComplete()}
                />
                <QuizViewer
                    isOpen={showQuiz}
                    onClose={() => setShowQuiz(false)}
                    questions={document.quiz || []}
                    onComplete={(score) => handleReviewComplete(score, (document.quiz?.length || 1))}
                />
                <StudyPlanViewer
                    isOpen={showStudyPlan}
                    onClose={() => setShowStudyPlan(false)}
                    plan={document.studyPlan || null}
                    onComplete={() => handleReviewComplete()}
                />
                <CodingQuestionsViewer
                    isOpen={showCodingQuestions}
                    onClose={() => setShowCodingQuestions(false)}
                    questions={document.codingQuestions || []}
                    onComplete={(solved) => handleReviewComplete(solved, (document.codingQuestions?.length || 1))}
                />

                <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                    <div className="px-14 group pb-[11px] pt-12">
                        <Toolbar 
                            initialData={document} 
                            onIconSelect={(value) => {
                                if (value.startsWith('http')) {
                                    setDocument(prev => prev ? { ...prev, coverImage: value } : null);
                                } else {
                                    setDocument(prev => prev ? { ...prev, icon: value } : null);
                                }
                            }}
                            onFlashcardsGenerated={(cards) => {
                                setDocument(prev => prev ? { ...prev, flashcards: cards } : null);
                            }}
                            onMindMapGenerated={(data) => {
                                 setDocument(prev => prev ? { ...prev, mindmap: data } : null);
                            }}
                            onQuizGenerated={(data) => {
                                 setDocument(prev => prev ? { ...prev, quiz: data } : null);
                            }}
                            onStudyPlanGenerated={(data) => {
                                 setDocument(prev => prev ? { ...prev, studyPlan: data } : null);
                            }}
                            onCodingQuestionsGenerated={(data) => {
                                 setDocument(prev => prev ? { ...prev, codingQuestions: data } : null);
                            }}
                            onViewFlashcards={() => setShowFlashcards(true)}
                            onViewMindMap={() => setShowMindMap(true)}
                            onViewQuiz={() => setShowQuiz(true)}
                            onViewStudyPlan={() => setShowStudyPlan(true)}
                            onViewCodingQuestions={() => setShowCodingQuestions(true)}
                            onResearch={onResearch}
                        />
                        <TextareaAutosize
                            value={document.title}
                            onChange={onTitleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const editor = window.document.querySelector('.ProseMirror') as HTMLElement;
                                    editor?.focus();
                                }
                            }}
                            className="w-full resize-none text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] placeholder:text-[#3F3F3F] dark:placeholder:text-[#CFCFCF]"
                            placeholder="New page"
                        />
                    </div>
                    
                    <Editor
                        onChange={onChange}
                        initialContent={document.content}
                    />
                </div>
            </div>
            
            <SemanticRadar 
                content={document.content || ""} 
                currentDocId={documentId!} 
                onInsertLink={handleInsertLink}
            />
        </div>
    );
}
