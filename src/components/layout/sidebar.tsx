import { 
  MessageSquare, 
  Search, 
  Settings, 
  PlusCircle, 
  ChevronsLeft,
  Home,
  Sparkles,
  BookOpen,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DocumentList } from "../document-list";
import { useDocuments } from "@/hooks/use-documents";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // Assuming Button is imported from somewhere

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
    { label: "Mastery", icon: BookOpen, href: "/dashboard/mastery" },
    { label: "Synthesis", icon: Layers, href: "/dashboard/synthesis" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    { label: "Add a page", icon: PlusCircle, onClick: true },
  ];

  const sectionItems = [
    // { label: "Documents", icon: Library, href: "/dashboard/documents" }, // Replaced by independent tree
    { label: "Inbox", icon: MessageSquare, href: "/dashboard/inbox" },
  ];

  return (
    <aside 
      className={cn(
        "group/sidebar h-full flex flex-col bg-background/80 backdrop-blur-xl border-r border-border/50 relative transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "h-6 w-6 text-muted-foreground rounded-lg hover:bg-black/5 dark:hover:bg-white/5 absolute right-2 top-3 opacity-0 group-hover/sidebar:opacity-100 transition-all cursor-pointer z-50 flex items-center justify-center",
          collapsed && "transform rotate-180 opacity-100 right-5"
        )}
      >
        <ChevronsLeft className="h-4 w-4" />
      </div>

      {/* Fixed Header */}
      <div className="flex flex-col shrink-0">
        {/* User Item */}
        <div className="p-4 mb-2 flex items-center gap-x-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-xs text-white font-black shadow-lg shadow-indigo-500/20 forced-color-adjust-none">
              N
          </div>
          {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground font-heading">NotionGPT</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pro Plan</span>
              </div>
          )}
        </div>

        {/* Main Nav */}
        <div className="flex flex-col gap-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
              return item.onClick ? (
                <button
                  key={item.label}
                  onClick={handleCreate}
                  className={cn(
                    "group relative min-h-[32px] text-sm py-1.5 px-3 w-full flex items-center text-muted-foreground font-medium rounded-xl transition-all hover:text-foreground hover:bg-primary/5",
                    collapsed && "justify-center px-1"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 mr-2.5 shrink-0 transition-transform group-hover:scale-110 text-indigo-500",
                  )} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.href!}
                  className={cn(
                      "group relative min-h-[32px] text-sm py-1.5 px-3 w-full flex items-center text-muted-foreground font-medium rounded-xl transition-all hover:text-foreground",
                      isActive && "text-foreground bg-primary/5",
                      collapsed && "justify-center px-1"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-1 w-1 h-4 bg-indigo-500 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "h-4 w-4 mr-2.5 shrink-0 transition-transform group-hover:scale-110",
                    isActive && "text-indigo-500"
                  )} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {item.label === "AI Chat" && !collapsed && (
                    <span className="ml-auto text-[10px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight shadow-sm shadow-indigo-500/20">AI</span>
                  )}
                </Link>
              );
          })}
        </div>

        <div className="mt-8 px-4 mb-2">
          {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-heading">Workspace</p>}
        </div>

        {/* Section Nav */}
        <div className="flex flex-col gap-y-0.5 px-3">
          {sectionItems.map((item) => (
            <Link
               key={item.label}
               to={item.href}
              className={cn(
                  "group min-h-[32px] text-sm py-1.5 px-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium rounded-xl transition-all hover:text-foreground",
                   collapsed && "justify-center px-1"
              )}
            >
              <item.icon className="h-4 w-4 mr-2.5 shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && (
                  <div className="ml-auto transition-opacity flex items-center">
                      <PlusCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                  </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Scrollable Documents Tree */}
      <div className="flex-1 overflow-y-auto mt-8 px-2 custom-scrollbar">
           {!collapsed && (
               <>
                 <div className="px-3 mb-2 flex items-center justify-between group sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-heading">My Notes</p>
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        role="button"
                        onClick={handleCreate}
                        className="bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg p-1 cursor-pointer transition-all shadow-sm"
                    >
                        <PlusCircle className="h-3.5 w-3.5" />
                    </motion.div>
                 </div>
                 <div className="px-1">
                    <DocumentList key={refreshKey} />
                 </div>
               </>
           )}
           {collapsed && (
              <div className="flex flex-col items-center gap-y-4 pt-4">
                 <PlusCircle 
                   onClick={handleCreate}
                   className="h-5 w-5 text-muted-foreground hover:text-indigo-500 cursor-pointer transition-colors" 
                  />
              </div>
           )}
      </div>

      {/* Fixed Footer */}
      <div className="mt-auto p-4 shrink-0">
        <div className={cn(
          "w-full bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/10 dark:to-violet-500/10 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl p-3 shadow-sm",
          collapsed ? "hidden" : "block"
        )}>
          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 font-heading">UPGRADE NOW</p>
          <p className="text-[10px] text-indigo-500/60 dark:text-indigo-400/60 font-medium mb-3">Get unlimited AI context and faster summaries.</p>
          <Button size="sm" className="w-full h-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-500/20 transition-all border-none">
            Unlock Everything
          </Button>
        </div>
      </div>
    </aside>
  );
}
