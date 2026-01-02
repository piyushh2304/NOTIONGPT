
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { FileText, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/hooks/use-documents";
import { toast } from "sonner";

const PageLinkComponent = ({ node, deleteNode }: { node: any, deleteNode: () => void }) => {
   const navigate = useNavigate();
   const { archiveDocument } = useDocuments();
   
   const handleDelete = async (e: React.MouseEvent) => {
       e.stopPropagation();
       const docId = node.attrs.id;
       if (docId) {
           const promise = archiveDocument(docId);
           toast.promise(promise, {
               loading: "Deleting page...",
               success: () => {
                   deleteNode();
                   return "Page deleted";
               },
               error: "Failed to delete page"
           });
       } else {
           deleteNode(); // Just remove block if no ID
       }
   };
   
   return (
     <NodeViewWrapper className="my-1">
        <div 
          className="flex items-center gap-2 p-1 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors group relative w-full"
          onClick={() => navigate(node.attrs.href)}
        >
            <div className="flex items-center justify-center text-muted-foreground">
               <FileText className="w-5 h-5 opacity-70" />
            </div>
            <span className="text-base font-medium border-b border-transparent group-hover:border-primary/20 leading-none">
                {node.attrs.title}
            </span>
            
            <div 
                role="button"
                onClick={handleDelete}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-all"
                title="Delete page"
            >
                <Trash className="w-4 h-4 text-muted-foreground hover:text-red-500" />
            </div>
        </div>
     </NodeViewWrapper>
   )
}

export const PageLink = Node.create({
    name: 'pageLink',
    group: 'block',
    atom: true, // It's a single unit, content is not editable directly here (it's the title)
    
    addAttributes() {
        return {
            title: { default: 'Untitled' },
            href: { default: '#' },
            id: { default: null } 
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="page-link"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-link' })]
    },

    addNodeView() {
        return ReactNodeViewRenderer(PageLinkComponent)
    }
})
