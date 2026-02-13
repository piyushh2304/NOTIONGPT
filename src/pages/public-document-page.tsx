import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@/components/editor/editor';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Simplified Document type for public view
type PublicDocument = {
    _id: string;
    title: string;
    content?: string;
    coverImage?: string;
    icon?: string;
    updatedAt: string;
};

export default function PublicDocumentPage() {
    const { documentId } = useParams();
    const [document, setDocument] = useState<PublicDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await fetch(`/api/documents/public/${documentId}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error("Document not found");
                    if (response.status === 403) throw new Error("This document is private");
                    throw new Error("Failed to load document");
                }
                const data = await response.json();
                setDocument(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (documentId) {
            fetchDocument();
        }
    }, [documentId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h1 className="text-2xl font-bold">oops!</h1>
                <p className="text-muted-foreground">{error || "Something went wrong"}</p>
                <Button asChild>
                    <Link to="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-40">
            {/* Navbar / CTA */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                 <div className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">NotionGPT</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">Built with NotionGPT</span>
                    <Button asChild size="sm">
                        <Link to="/signup">Try it free</Link>
                    </Button>
                 </div>
            </div>

            {/* Cover Image */}
            {document.coverImage && (
                <div className="relative w-full h-[35vh] group">
                    <img 
                        src={document.coverImage} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-12 mt-12 pb-20">
                {/* Icon & Title */}
                 <div className="group pb-[11px]">
                    {document.icon && (
                        <div className="text-[78px] mb-4">
                            {document.icon}
                        </div>
                    )}
                    <h1 className="text-5xl font-bold text-[#3F3F3F] dark:text-[#CFCFCF] break-words">
                        {document.title}
                    </h1>
                    <div className="text-sm text-muted-foreground mt-4">
                        Last edited {format(new Date(document.updatedAt), 'MMM d, yyyy')}
                    </div>
                 </div>

                 {/* Read-only Editor */}
                 <Editor
                    onChange={() => {}} // No-op
                    initialContent={document.content}
                    readOnly={true}
                 />
            </div>
        </div>
    );
}
