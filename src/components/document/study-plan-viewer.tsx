import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Circle, Clock, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Day {
    day: number;
    topic: string;
    activities: string[];
    duration: string;
}

interface Week {
    week: number;
    title: string;
    days: Day[];
}

interface StudyPlan {
    title: string;
    weeks: Week[];
}

interface StudyPlanViewerProps {
    isOpen: boolean;
    onClose: () => void;
    plan: StudyPlan | null;
    onComplete?: () => void;
}

const WEEK_COLORS = [
    "border-blue-200 bg-blue-50/50 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/30",
    "border-purple-200 bg-purple-50/50 text-purple-700 dark:bg-purple-900/10 dark:border-purple-900/30",
    "border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/30",
    "border-amber-200 bg-amber-50/50 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900/30",
];

export function StudyPlanViewer({ isOpen, onClose, plan, onComplete }: StudyPlanViewerProps) {
    const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

    if (!plan) return null;

    const handleClose = () => {
        if (onComplete) onComplete();
        onClose();
    };

    const toggleActivity = (weekIdx: number, dayIdx: number, actIdx: number) => {
        const id = `${weekIdx}-${dayIdx}-${actIdx}`;
        const next = new Set(completedActivities);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCompletedActivities(next);
    };

    const totalActivities = plan.weeks.reduce((acc, w) => acc + w.days.reduce((dAcc, d) => dAcc + d.activities.length, 0), 0);
    const progress = totalActivities > 0 ? (completedActivities.size / totalActivities) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                            <div className="p-2 rounded-xl bg-green-500/10">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            {plan.title || "Your Custom Study Plan"}
                        </DialogTitle>
                    </div>
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-10">
                    {plan.weeks.map((week, wIdx) => (
                        <div key={wIdx} className="space-y-4">
                            <div className={cn(
                                "px-4 py-2 rounded-lg border w-fit font-bold flex items-center gap-2 mb-6",
                                WEEK_COLORS[wIdx % WEEK_COLORS.length]
                            )}>
                                <BookOpen className="w-4 h-4" />
                                Week {week.week}: {week.title}
                            </div>

                            <div className="grid gap-6">
                                {week.days.map((day, dIdx) => (
                                    <div key={dIdx} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-0 before:w-px before:bg-border last:before:hidden">
                                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-[10px] text-primary z-10">
                                            D{day.day}
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-2xl p-5 border border-transparent hover:border-border transition-all">
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                                <h4 className="text-base font-bold text-foreground">{day.topic}</h4>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background rounded-full border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {day.duration}
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {day.activities.map((activity, aIdx) => {
                                                    const isDone = completedActivities.has(`${wIdx}-${dIdx}-${aIdx}`);
                                                    return (
                                                        <button
                                                            key={aIdx}
                                                            onClick={() => toggleActivity(wIdx, dIdx, aIdx)}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all group",
                                                                isDone 
                                                                    ? "bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30" 
                                                                    : "bg-background hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {isDone 
                                                                ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                                : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                                            }
                                                            <span className={cn(
                                                                "text-sm leading-snug",
                                                                isDone ? "text-green-800 line-through opacity-70 dark:text-green-300" : "text-foreground"
                                                            )}>
                                                                {activity}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
