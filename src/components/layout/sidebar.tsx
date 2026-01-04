
import { 
  MessageSquare, 
  Search, 
  Settings, 
  PlusCircle, 
  ChevronsLeft,
  Home,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DocumentList } from "../document-list";
import { useDocuments } from "@/hooks/use-documents";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Sidebar({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { createDocument } = useDocuments();

  const handleCreate = async () => {
      const promise = createDocument("Untitled");
      
      toast.promise(promise, {
        loading: "Creating a new note...",
        success: (doc) => {
            setRefreshKey(prev => prev + 1); // Force refresh of list
            navigate(`/dashboard/documents/${doc._id}`);
            return "New note created!";
        },
        error: "Failed to create a new note."
      });
  };

  const navItems = [
    { label: "Home", icon: Home, href: "/dashboard" },
    { label: "Search", icon: Search, href: "/dashboard/search" },
    { label: "AI Chat", icon: Sparkles, href: "/dashboard/ai-chat" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const sectionItems = [
    // { label: "Documents", icon: Library, href: "/dashboard/documents" }, // Replaced by independent tree
    { label: "Inbox", icon: MessageSquare, href: "/dashboard/inbox" },
  ];

  return (
    <aside 
      className={cn(
        "group/sidebar h-full overflow-y-auto bg-secondary/30 flex flex-col border-r relative transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute right-2 top-3 opacity-0 group-hover/sidebar:opacity-100 transition cursor-pointer",
          collapsed && "transform rotate-180 opacity-100 right-5" // Keep visible if collapsed
        )}
      >
        <ChevronsLeft className="h-6 w-6" />
      </div>

      {/* User Item */}
      <div className="p-3 mb-2 flex items-center gap-x-2">
        <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center text-xs text-primary-foreground font-bold">
            A
        </div>
        {!collapsed && (
            <span className="font-medium text-sm truncate">AIODocs Workspace</span>
        )}
      </div>

      {/* Main Nav */}
      <div className="flex flex-col gap-y-1 px-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
                "group min-h-[27px] text-sm py-1 px-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium rounded-sm transition-colors",
                location.pathname === item.href && "bg-primary/5 text-primary",
                collapsed && "justify-center px-1"
            )}
          >
            <item.icon className="h-4 w-4 mr-2 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </div>

      <div className="mt-4 px-3 mb-1">
        {!collapsed && <p className="text-xs font-semibold text-muted-foreground uppercase">Workspace</p>}
      </div>

       {/* Section Nav */}
       <div className="flex flex-col gap-y-1 px-2">
        {sectionItems.map((item) => (
          <Link
             key={item.label}
             to={item.href}
            className={cn(
                "group min-h-[27px] text-sm py-1 px-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium rounded-ms transition-colors",
                 collapsed && "justify-center px-1"
            )}
          >
            <item.icon className="h-4 w-4 mr-2 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 h-full flex items-center">
                    <PlusCircle className="h-3 w-3" />
                </div>
            )}
          </Link>
        ))}
      </div>

      {/* Documents Tree (Phase 3) */}
      <div className="mt-4">
           {!collapsed && (
               <>
                 <div className="px-3 mb-1 flex items-center justify-between group">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Private</p>
                    <div 
                        role="button"
                        onClick={handleCreate}
                        className="opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-sm p-0.5 cursor-pointer transition"
                    >
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                 </div>
                 <DocumentList key={refreshKey} />
               </>
           )}
      </div>

      <div 
        className={cn(
          "absolute bottom-0 w-full p-2 border-t bg-background/50 backdrop-blur-sm",
          collapsed ? "flex justify-center" : ""
        )}
      >
          {/* Footer content could go here */}
      </div>

    </aside>
  );
}
