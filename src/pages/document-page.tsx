
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { useDocuments, type Document } from '@/hooks/use-documents';
import Editor from '@/components/editor/editor';
import { Toolbar } from '@/components/document/toolbar';
import { Cover } from '@/components/document/cover';

export default function DocumentPage() {
    const params = useParams();
    const { getDocument, updateDocument } = useDocuments();
    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        <div key={documentId} className="pb-40">
            <Cover 
                url={document.coverImage} 
                onRemove={() => setDocument(doc => doc ? { ...doc, coverImage: "" } : null)}
                onChange={(url) => setDocument(doc => doc ? { ...doc, coverImage: url } : null)}
            />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <div className="px-14 group pb-[11px] pt-12">
                    <Toolbar 
                        initialData={document} 
                        // Renaming for clarity in parent content if possible, but keeping prop name compatible
                        onIconSelect={(value) => {
                            // Heuristic: if it looks like a URL, it's a cover. If emoji, it's icon. 
                            // Or just refetch/update both?
                            // Actually, onIconSelect signature is (icon: string). 
                            // I should probably pass a Partial<Document> to be safe or just use it to force re-render.
                            // But for now, since I passed defaultCover string, I can check.
                            if (value.startsWith('http')) {
                                setDocument(prev => prev ? { ...prev, coverImage: value } : null);
                            } else {
                                setDocument(prev => prev ? { ...prev, icon: value } : null);
                            }
                        }}
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
