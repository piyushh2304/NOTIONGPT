
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export default function DocumentPage() {
    const params = useParams();
    const { getDocument, updateDocument } = useDocuments();
    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [showMindMap, setShowMindMap] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

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

    const onTitleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!documentId) return;
        setDocument(prev => prev ? { ...prev, title: e.target.value } : null);
        // Debounce this too
        await updateDocument(documentId, { title: e.target.value });
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
        <div key={documentId} className="pb-40 relative group">
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
            />
            <MindMapViewer 
                isOpen={showMindMap}
                onClose={() => setShowMindMap(false)}
                initialNodes={document.mindmap?.initialNodes || []}
                initialEdges={document.mindmap?.initialEdges || []}
            />
            <QuizViewer
                isOpen={showQuiz}
                onClose={() => setShowQuiz(false)}
                questions={document.quiz || []}
            />

            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <div className="px-14 group pb-[11px] pt-12">
                    <Toolbar 
                        initialData={document} 
                        // Renaming for clarity in parent content if possible, but keeping prop name compatible
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
                        onViewFlashcards={() => setShowFlashcards(true)}
                        onViewMindMap={() => setShowMindMap(true)}
                        onViewQuiz={() => setShowQuiz(true)}
                    />
                    <TextareaAutosize
                        value={document.title}
                        onChange={onTitleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // Focus the editor
                                const editor = window.document.querySelector('.ProseMirror') as HTMLElement;
                                editor?.focus();
                            }
                        }}
                        className="w-full resize-none text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] placeholder:text-[#3F3F3F] dark:placeholder:text-[#CFCFCF]"
                        placeholder="New page"
                    />
                </div>
                
                {/* Editor */}
                <Editor
                    onChange={onChange}
                    initialContent={document.content}
                />
            </div>
        </div>
    );
}
