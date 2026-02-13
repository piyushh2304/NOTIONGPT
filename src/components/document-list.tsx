
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments, type Document } from '@/hooks/use-documents';
import { cn } from '@/lib/utils';
import { 
    ChevronRight, 
    File, 
    Plus, 
    MoreHorizontal, 
    Trash, 
    FileText, 
    Table, 
    FileCode, 
    ExternalLink, 
    Copy, 
    Pencil, 
    FilePlus 
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface DocumentListProps {
    parentDocumentId?: string | null;
    level?: number;
    data?: Document[];
}

export const DocumentList = ({
    parentDocumentId = null,
    level = 0
}: DocumentListProps) => {
    const params = useParams();
    const navigate = useNavigate();
    const { getDocuments, createDocument, archiveDocument, updateDocument, duplicateDocument } = useDocuments();
    
    const [documents, setDocuments] = useState<Document[] | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const onExpand = (documentId: string) => {
        setExpanded(prev => ({
            ...prev,
            [documentId]: !prev[documentId]
        }));
    };

    useEffect(() => {
        const fetchDocs = async () => {
            const docs = await getDocuments(parentDocumentId);
            setDocuments(docs);
        };
        fetchDocs();

        const handleUpdate = (event: any) => {
            const { id, title } = event.detail;
            setDocuments(prev => prev?.map(doc => doc._id === id ? { ...doc, title } : doc) ?? null);
        };

        window.addEventListener('document-updated', handleUpdate);
        return () => window.removeEventListener('document-updated', handleUpdate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentDocumentId, getDocuments]);

    const onCreate = async (e: React.MouseEvent, parentId: string | null) => {
        e.stopPropagation();
        try {
            const doc = await createDocument("", parentId || undefined);
            if (!doc) return;
            
            setExpanded(prev => ({...prev, [doc._id]: true})); 
            setDocuments(prev => prev ? [...prev, doc] : [doc]);
            navigate(`/dashboard/documents/${doc._id}`);
        } catch (error) {
           // Toast in hook
        }
    };

    const onDelete = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        await archiveDocument(docId);
        setDocuments(prev => prev?.filter((d) => d._id !== docId) ?? null);
        if (params.documentId === docId) {
            navigate('/dashboard/documents');
        }
    };

     const onDuplicate = async (e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        const newDoc = await duplicateDocument(doc);
        if(newDoc) {
            setDocuments(prev => prev ? [...prev, newDoc] : [newDoc]);
        }
    };

    const onRename = async (e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        const newTitle = window.prompt("Rename document:", doc.title);
        if (newTitle && newTitle !== doc.title) {
            await updateDocument(doc._id, { title: newTitle });
            setDocuments(prev => prev?.map(d => d._id === doc._id ? { ...d, title: newTitle } : d) ?? null);
        }
    };

    const onOpenNewTab = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        window.open(`/dashboard/documents/${docId}`, '_blank');
    };

    const onCopyLink = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        const url = `${window.location.origin}/dashboard/documents/${docId}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    const onRedirect = (documentId: string) => {
        navigate(`/dashboard/documents/${documentId}`);
    };

    if (documents === null) {
        return (
            <>
              <Item.Skeleton level={level} />
              {level === 0 && (
                  <>
                     <Item.Skeleton level={level} />
                     <Item.Skeleton level={level} />
                  </>
              )}
            </>
        );
    }

    return (
        <>
            <div 
                style={{ paddingLeft: level ? `${(level * 12) + 25}px` : undefined }}
                className={cn(
                    "hidden text-sm font-medium text-muted-foreground/80 py-1",
                    expanded && "last:block",
                    level === 0 && "hidden"
                )}
            >
                <div 
                    role="button" 
                    onClick={(e) => onCreate(e, parentDocumentId)}
                    className="flex items-center gap-x-2 hover:text-foreground transition-colors cursor-pointer"
                >
                    <Plus className="h-3 w-3" />
                    <span>Add a page</span>
                </div>
            </div>
            {documents.map((doc) => (
                <div key={doc._id}>
                    <Item
                        id={doc._id}
                        onClick={() => onRedirect(doc._id)}
                        document={doc}
                        active={params.documentId === doc._id}
                        level={level}
                        onExpand={() => onExpand(doc._id)}
                        expanded={expanded[doc._id]}
                        onCreate={(e) => onCreate(e, doc._id)}
                        onDelete={(e) => onDelete(e, doc._id)}
                        onDuplicate={(e) => onDuplicate(e, doc)}
                        onRename={(e) => onRename(e, doc)}
                        onOpenNewTab={(e) => onOpenNewTab(e, doc._id)}
                        onCopyLink={(e) => onCopyLink(e, doc._id)}
                    />
                    {expanded[doc._id] && (
                        <DocumentList
                            parentDocumentId={doc._id}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
};

// --- Helper Item Component ---

interface ItemProps {
    id?: string;
    document?: Document; // Changed to accept full document
    active?: boolean;
    expanded?: boolean;
    isSearch?: boolean;
    level?: number;
    onExpand?: () => void;
    onClick?: () => void;
    onCreate?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    onDuplicate?: (e: React.MouseEvent) => void;
    onRename?: (e: React.MouseEvent) => void;
    onOpenNewTab?: (e: React.MouseEvent) => void;
    onCopyLink?: (e: React.MouseEvent) => void;
}

const getFileIcon = (title: string) => {
   const lower = title.toLowerCase();
   if (lower.endsWith('.csv') || lower.includes('csv')) return Table;
   if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.json')) return FileCode;
   return FileText;
};

const Item = ({
    id,
    document,
    onClick,
    active,
    level = 0,
    onExpand,
    expanded,
    isSearch,
    onCreate,
    onDelete,
    onDuplicate,
    onRename,
    onOpenNewTab,
    onCopyLink
}: ItemProps) => {
    const ChevronIcon = expanded ? ChevronRight : ChevronRight; 

    // Determine Icon
    const Icon = document ? getFileIcon(document.title) : File;
    const documentIcon = document?.icon;

    return (
        <div
            onClick={onClick}
            role="button"
            style={{ paddingLeft: level ? `${(level * 12) + 12}px` : "12px" }}
            className={cn(
                "group min-h-[27px] text-sm py-1 pr-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium",
                active && "bg-primary/5 text-primary"
            )}
        >
            {!!id && (
                <div
                    role="button"
                    className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpand?.();
                    }}
                >
                    <ChevronRight
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform", expanded && "rotate-90")}
                    />
                </div>
            )}
            
            {documentIcon ? (
                <div className="shrink-0 mr-2 text-[18px]">{documentIcon}</div>
            ) : (
                <Icon className="shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground" />
            )}
            
            <span className="truncate">{document?.title || "Untitled"}</span>

            {/* Actions */}
            {!!id && (
                <div className="ml-auto flex items-center gap-x-2">
                    <DropdownMenu>
                         <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            asChild
                         >
                             <div role="button" className="h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600">
                                 <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                             </div>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-60" align="start" side="right" forceMount>
                            <DropdownMenuItem onClick={onRename}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate}>
                                <FilePlus className="h-4 w-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={onCopyLink}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy link
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={onOpenNewTab}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in new tab
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <div className="text-xs text-muted-foreground p-2">
                                Last edited by: User
                            </div>
                         </DropdownMenuContent>
                    </DropdownMenu>

                    <div
                        role="button"
                        onClick={onCreate}
                        className="h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
                    >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            )}
        </div>
    );
};

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
    return (
        <div
            style={{ paddingLeft: level ? `${(level * 12) + 25}px` : "12px" }}
            className="flex gap-x-2 py-[3px]"
        >
            <div className="h-4 w-4 bg-muted rounded-sm animate-pulse" />
            <div className="h-4 w-[30%] bg-muted rounded-md animate-pulse" />
        </div>
    );
};
