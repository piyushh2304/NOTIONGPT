import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
    title: string;
    userId: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    parentDocument?: mongoose.Types.ObjectId;
    content?: any; // Stored as JSON Object (Tiptap JSON)
    coverImage?: string;
    icon?: string;
    isArchived: boolean;
    isPublished: boolean;
    isPublic: boolean;
    // allowedUsers: string[]; // Deprecated in favor of collaborators
    collaborators: Array<{
        userId: mongoose.Types.ObjectId;
        email: string; // Cache email for easier display
        role: 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER';
        addedAt: Date;
    }>;
    recurrence?: {
        rule: string; // RRule string
        nextRun: Date;
        lastRun?: Date;
    };
    flashcards?: any;
    mindmap?: any;
    quiz?: any;
    studyPlan?: any;
    codingQuestions?: any;
    lastReviewedAt?: Date;
    nextReviewAt?: Date;
    masteryLevel?: number;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    parentDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    content: { type: Schema.Types.Mixed }, // Stored as JSON Object (Notion-like Block Tree)
    coverImage: { type: String },
    icon: { type: String },
    isArchived: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false }, // "Anyone with link" access
    // allowedUsers: [{ type: String }],
    collaborators: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        email: { type: String },
        role: { type: String, enum: ['VIEWER', 'COMMENTER', 'EDITOR', 'OWNER'], default: 'VIEWER' },
        addedAt: { type: Date, default: Date.now }
    }],
    recurrence: {
        rule: { type: String },
        nextRun: { type: Date },
        lastRun: { type: Date }
    },
    flashcards: { type: Schema.Types.Mixed }, // Array of { front: string, back: string }
    mindmap: { type: Schema.Types.Mixed }, // { nodes: [], edges: [] } for ReactFlow
    quiz: { type: Schema.Types.Mixed }, // Array of { question: string, options: string[], answer: string }
    studyPlan: { type: Schema.Types.Mixed }, // Structured JSON for study plan
    codingQuestions: { type: Schema.Types.Mixed }, // Array of { title: string, problem: string, hint: string, solution: string }
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
    masteryLevel: { type: Number, default: 0 } // 0-5
}, { timestamps: true });
// Index for faster queries within an organization and hierarchy
DocumentSchema.index({ orgId: 1, parentDocument: 1 });
DocumentSchema.index({ userId: 1 });
DocumentSchema.index({ title: 'text' });

export default mongoose.model<IDocument>('document', DocumentSchema);