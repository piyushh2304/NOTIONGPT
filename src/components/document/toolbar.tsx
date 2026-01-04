import { ImageIcon, Smile, X, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocuments, type Document } from "@/hooks/use-documents";
import { IconPicker } from "@/components/icon-picker";
import { Doc2LearnDialog } from "./doc2learn-dialog";

interface ToolbarProps {
  initialData: Document;
  preview?: boolean;
  onIconSelect?: (icon: string) => void;
  onFlashcardsGenerated?: (cards: any[]) => void;
  onMindMapGenerated?: (data: any) => void;
  onQuizGenerated?: (data: any[]) => void;
  onViewFlashcards?: () => void;
  onViewMindMap?: () => void;
  onViewQuiz?: () => void;
}

export const Toolbar = ({ 
    initialData, 
    preview, 
    onIconSelect: onIconUpdate, 
    onFlashcardsGenerated, 
    onMindMapGenerated,
    onQuizGenerated,
    onViewFlashcards,
    onViewMindMap,
    onViewQuiz
}: ToolbarProps) => {
  const { updateDocument } = useDocuments();

  const onIconSelect = (icon: string) => {
    updateDocument(initialData._id, { icon });
    if (onIconUpdate) onIconUpdate(icon);
  };

  const onRemoveIcon = () => {
    updateDocument(initialData._id, { icon: "" });
    if (onIconUpdate) onIconUpdate("");
  };

  if (!!initialData.icon && preview) {
    return (
      <div className="pt-6 group relative">
        <div className="text-6xl pt-6 transition group-hover:opacity-75">
          {initialData.icon}
        </div>
      </div>
    );
  }

  if (!!initialData.icon && !preview) {
     return (
        <div className="relative group pt-6">
            <div className="flex items-center gap-x-2 group/icon pt-6">
                <IconPicker onChange={onIconSelect} asChild>
                    <p className="text-6xl hover:bg-muted rounded-md transition p-2 cursor-pointer">{initialData.icon}</p>
                </IconPicker>
                <Button
                    onClick={onRemoveIcon}
                    className="rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs"
                    variant="outline"
                    size="icon"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
     )
  }

  const onCoverSelect = () => {
    // Default cover
    const defaultCover = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80";
    updateDocument(initialData._id, { coverImage: defaultCover });
    // Using onIconUpdate as generic update signal for now
    if (onIconUpdate) onIconUpdate(defaultCover); 
  };

  // Simplified for now: specific buttons visible on hover of parent
  // Assuming 'initialData.content' is available on the document object, even if purely client side for now.
  // If content is huge, passing it around might be heavy, but for text based docs it's fine.
  // We need to ensure initialData actually carries the content string/json.
  const documentContent = initialData.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "";
  
  // Feature flags
  const hasFlashcards = initialData.flashcards && initialData.flashcards.length > 0;
  const hasMindMap = initialData.mindmap && initialData.mindmap.initialNodes && initialData.mindmap.initialNodes.length > 0;
  const hasQuiz = initialData.quiz && initialData.quiz.length > 0;

  return (
    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4">
      {!initialData.icon && !preview && (
        <IconPicker onChange={onIconSelect} asChild>
            <Button
                className="text-muted-foreground text-xs"
                variant="ghost"
                size="sm"
            >
                <Smile className="h-4 w-4 mr-2" />
                Add icon
            </Button>
        </IconPicker>
      )}
      {!initialData.coverImage && !preview && (
        <Button
             className="text-muted-foreground text-xs"
             variant="ghost"
             size="sm"
             onClick={onCoverSelect} 
        >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add cover
        </Button>
      )}

      {/* Doc2Learn Button (AI Tools) */}
      {!preview && (
          <Doc2LearnDialog 
            documentId={initialData._id} 
            documentContent={documentContent}
            onFlashcardsGenerated={onFlashcardsGenerated}
            onMindMapGenerated={onMindMapGenerated}
            onQuizGenerated={onQuizGenerated}
            hasFlashcards={hasFlashcards}
            hasMindMap={hasMindMap}
            hasQuiz={hasQuiz}
            onViewFlashcards={onViewFlashcards}
            onViewMindMap={onViewMindMap}
            onViewQuiz={onViewQuiz}
          >
              <Button
                  className="text-muted-foreground text-xs"
                  variant="ghost"
                  size="sm"
              >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Tools
              </Button>
          </Doc2LearnDialog>
      )}
    </div>
  );
};

