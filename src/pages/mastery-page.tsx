import { useState, useEffect } from "react";
import { useDocuments, type Document } from "@/hooks/use-documents";
import { useAuth } from "@/context/auth-context";
import { 
    Brain, 
    Calendar, 
    TrendingUp, 
    Award, 
    Clock, 
    ChevronRight, 
    BookOpen,
    Target,
    Zap,
    Sparkles,
    Shield,
    ArrowUpRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { isAfter, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MasteryPage() {
    const { getDocuments } = useDocuments();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
             const docs = await getDocuments();
             setDocuments(docs);
             setIsLoading(false);
        };
        load();
    }, [getDocuments]);

    const reviewQueue = documents.filter(doc => {
        const hasAssets = (doc.flashcards?.length || 0) > 0 || (doc.quiz?.length || 0) > 0 || (doc.codingQuestions?.length || 0) > 0;
        if (!hasAssets) return false;
        if (doc.nextReviewAt) {
            return !isAfter(new Date(doc.nextReviewAt), new Date());
        }
        if (!doc.lastReviewedAt) return true;
        const oneDayAgo = subDays(new Date(), 1);
        return !isAfter(new Date(doc.lastReviewedAt), oneDayAgo);
    });

    const masteredDocs = documents.filter(doc => (doc.masteryLevel || 0) >= 4);
    const totalMastery = documents.length > 0 
        ? (documents.reduce((acc, d) => acc + (d.masteryLevel || 0), 0) / (documents.length * 5)) * 100 
        : 0;

    const stats = [
        { label: "Knowledge Coverage", value: `${Math.round(totalMastery)}%`, icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Pending Reviews", value: reviewQueue.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Mastered Topics", value: masteredDocs.length, icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Daily Streak", value: `${user?.streakCount || 0} Days`, icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];

    if (isLoading) return (
        <div className="h-full flex items-center justify-center bg-background">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <Sparkles className="w-8 h-8 text-indigo-500" />
            </motion.div>
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="h-full flex flex-col bg-[#fcfcfd] dark:bg-[#09090b] overflow-y-auto"
        >
            {/* Header Section */}
            <div className="px-8 pt-10 pb-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <motion.h1 variants={itemVariants} className="text-4xl font-black font-heading tracking-tight text-foreground flex items-center gap-3">
                            Subject Mastery
                            <span className="text-sm font-bold bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20">Elite</span>
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-muted-foreground font-medium text-lg">
                            Track your cognitive growth and spaced repetition progress.
                        </motion.p>
                    </div>
                    
                    <motion.div variants={itemVariants} className="flex items-center gap-3 bg-white dark:bg-[#121214] p-2 rounded-2xl border shadow-sm">
                        <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">
                            Goal: {Math.min(100, Math.round(((user?.reviewsToday || 0) / 5) * 100))}%
                        </div>
                        <div className="px-4 py-2 text-foreground font-bold text-sm font-heading flex items-center gap-2">
                            {user?.streakCount || 0} DAY STREAK 🔥
                        </div>
                    </motion.div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {stats.map((stat) => (
                        <motion.div 
                            key={stat.label}
                            variants={itemVariants}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="p-6 bg-white dark:bg-[#121214] rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group transition-all"
                        >
                            <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", stat.bg)} />
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className={cn("p-3 rounded-2xl w-fit shadow-inner", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider font-heading">{stat.label}</p>
                                    <p className="text-3xl font-black text-foreground">{stat.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Review Queue */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black font-heading text-foreground flex items-center gap-2 uppercase tracking-wide">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Study Queue
                        </h2>
                        {reviewQueue.length > 0 && (
                             <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full border border-amber-500/20">
                                {reviewQueue.length} TASKS DUE
                             </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {reviewQueue.length > 0 ? (
                                reviewQueue.map((doc) => (
                                    <motion.div
                                        key={doc._id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        whileHover={{ x: 5 }}
                                        className="group bg-white dark:bg-[#121214] p-5 rounded-[1.5rem] border border-border/50 shadow-sm flex items-center gap-5 hover:border-indigo-500/30 transition-all cursor-pointer"
                                        onClick={() => navigate(`/dashboard/documents/${doc._id}`)}
                                    >
                                        <div className="h-14 w-14 bg-indigo-500/5 text-2xl flex items-center justify-center rounded-2xl border border-indigo-500/10 group-hover:bg-indigo-50 group-hover:text-white transition-all">
                                            {doc.icon || "📄"}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-500 transition-colors uppercase tracking-tight font-heading">{doc.title}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 max-w-[120px]">
                                                    <Progress value={(doc.masteryLevel || 0) * 20} className="h-1.5" />
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mastery Lvl {Math.floor(doc.masteryLevel || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-tighter">Due Now</span>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    variants={itemVariants}
                                    className="bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-[2rem] p-12 text-center space-y-4"
                                >
                                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-emerald-600 font-heading">Complete Control</h3>
                                        <p className="text-emerald-600/60 font-medium">Your knowledge is up to date. No pending reviews!</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Insights & Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div 
                        variants={itemVariants}
                        className="bg-indigo-600 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-500/40 relative overflow-hidden"
                    >
                        <Sparkles className="absolute -top-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                        <div className="space-y-2 relative z-10">
                            <h2 className="text-2xl font-black font-heading tracking-tight leading-tight">Mastery Command</h2>
                            <p className="text-indigo-100 font-medium text-sm">Ready to push your limits? Launch into your personalized daily review session.</p>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Session Progress</span>
                                <span className="text-lg font-black">{Math.min(100, Math.round(((user?.reviewsToday || 0) / 5) * 100))}%</span>
                            </div>
                            <Progress value={Math.min(100, ((user?.reviewsToday || 0) / 5) * 100)} className="h-3 bg-indigo-400/30" />
                        </div>
                        <Button 
                            className="w-full rounded-2xl h-14 gap-3 bg-white text-indigo-600 hover:bg-indigo-50 font-black text-sm uppercase tracking-widest shadow-xl transition-all border-none group"
                            onClick={() => reviewQueue[0] && navigate(`/dashboard/documents/${reviewQueue[0]._id}`)}
                            disabled={reviewQueue.length === 0}
                        >
                            Start Session
                            <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                        </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#121214] rounded-[2rem] border border-border/50 p-8 space-y-6 shadow-sm">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black font-heading text-foreground uppercase tracking-tight">AI Insights</h3>
                            <p className="text-sm text-muted-foreground font-medium italic">"Consistent daily reviews lead to 4x better retention over time."</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <TrendingUp className="w-8 h-8 text-indigo-500" />
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black text-foreground uppercase tracking-widest font-heading">Current Velocity</p>
                                    <p className="text-xs text-muted-foreground font-bold">Growing by 12% weekly</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-emerald-500">
                                <Target className="w-8 h-8" />
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black uppercase tracking-widest font-heading">Daily Efficiency</p>
                                    <p className="text-xs font-bold">Optimal learning window hit</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
