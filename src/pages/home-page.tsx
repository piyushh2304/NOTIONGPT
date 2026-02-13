import { useEffect, useState } from "react";
import { useDocuments, type Document } from "@/hooks/use-documents";
import { FileText, Clock, ExternalLink, Calendar, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = () => {
    const { getAllDocuments } = useDocuments();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Greeting Logic
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";

    useEffect(() => {
        const fetchRecent = async () => {
            const docs = await getAllDocuments();
            // Sort by updatedAt descending
            const sorted = docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setDocuments(sorted.slice(0, 10)); // Top 10 recent
            setLoading(false);
        };
        fetchRecent();
    }, []);

    if (loading) {
        return <div className="p-8 max-w-5xl mx-auto space-y-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
        </div>;
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
             <div className="p-8 max-w-5xl mx-auto w-full space-y-12 pb-20">
                
                {/* Header Greeting */}
                <div className="text-center py-4">
                    <h1 className="text-3xl font-semibold text-foreground/80">{greeting}</h1>
                </div>

                {/* Recently Visited */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pl-1">
                        <Clock className="w-4 h-4" />
                        <span>Recently visited</span>
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex w-max space-x-4">
                            {documents.map((doc) => (
                                <div 
                                    key={doc._id}
                                    onClick={() => navigate(`/dashboard/documents/${doc._id}`)}
                                    className="w-[180px] group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    <div className="h-10 w-10 flex items-center justify-center rounded bg-secondary/50 text-secondary-foreground group-hover:bg-white dark:group-hover:bg-neutral-700 transition-colors">
                                        {doc.icon ? <span className="text-lg">{doc.icon}</span> : <FileText className="w-5 h-5" />}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h3 className="font-medium truncate text-sm">{doc.title}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                           <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="text-sm text-muted-foreground pl-1">No recently visited documents</div>
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>

                {/* AI Learning Paths */}
                
                {/* Recently Visited */}
                 <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium pl-1">
                        <Calendar className="w-4 h-4" />
                        <span>Upcoming events</span>
                    </div>
                     <div className="rounded-xl border bg-card p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
                         <div className="space-y-2 max-w-md">
                             <div className="w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
                                <Calendar className="w-5 h-5" />
                             </div>
                             <h3 className="font-medium">Connect AI Meeting Notes with your Calendar events</h3>
                             <p className="text-sm text-muted-foreground">Join calls, transcribe audio, and summarize meetings all in Notion.</p>
                             <Button variant="link" className="p-0 h-auto text-blue-500">Connect Notion Calendar</Button>
                         </div>
                         <div className="hidden md:block h-32 w-[1px] bg-border" />
                         <div className="w-full md:w-1/2 space-y-4">
                             <div className="flex gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <div className="text-xs text-muted-foreground w-12 pt-1">Today</div>
                                <div className="border-l-2 border-primary pl-4 space-y-1">
                                    <div className="font-medium text-sm">Team standup</div>
                                    <div className="text-xs text-muted-foreground">9 AM · Office</div>
                                </div>
                             </div>
                             
                              <div className="flex gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors opacity-60">
                                <div className="text-xs text-muted-foreground w-12 pt-1">Sat</div>
                                <div className="border-l-2 border-primary/50 pl-4 space-y-1">
                                    <div className="font-medium text-sm">Project Check-in</div>
                                    <div className="text-xs text-muted-foreground">10 AM · Office</div>
                                </div>
                             </div>
                         </div>
                     </div>
                 </section>

             </div>
        </div>
    );
};

export default HomePage;
