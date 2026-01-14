import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { CoverPicker } from "@/components/cover-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";

interface CoverProps {
  url?: string;
  preview?: boolean;
  onRemove?: () => void;
  onChange?: (url: string) => void;
}

export const Cover = ({ url, preview, onRemove: onRemoveCallback, onChange: onChangeCallback }: CoverProps) => {
  const { updateDocument } = useDocuments();
  const params = useParams();

  const onRemove = () => {
    if (params.documentId) {
       updateDocument(params.documentId, { coverImage: "" });
       if (onRemoveCallback) onRemoveCallback();
    }
  };

  const onChange = (url: string) => {
    if (params.documentId) {
        updateDocument(params.documentId, { coverImage: url });
        if (onChangeCallback) onChangeCallback(url);
    }
  };

  return (
    <div className={cn(
        "relative w-full h-[35vh] group",
        !url && "h-[12vh]",
        url && "bg-muted"
    )}>
        {!!url && (
            <img 
              src={url} 
              alt="Cover" 
              className="object-cover w-full h-full"
            />
        )}
        {url && !preview && (
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2 transition-opacity duration-300">
                <CoverPicker onChange={onChange} asChild>
                    <Button
                        className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm border-white/20 text-xs shadow-md"
                        variant="outline"
                        size="sm"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change cover
                    </Button>
                </CoverPicker>
                <Button
                    onClick={onRemove}
                    className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm border-white/20 text-xs shadow-md"
                    variant="outline"
                    size="sm"
                >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                </Button>
            </div>
        )}
    </div>
  );
};
