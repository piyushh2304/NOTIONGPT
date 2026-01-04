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
    allowedUsers: string[];
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
    allowedUsers: [{ type: String }], // List of emails allowed to access
    flashcards: { type: Schema.Types.Mixed }, // Array of { front: string, back: string }
    mindmap: { type: Schema.Types.Mixed }, // { nodes: [], edges: [] } for ReactFlow
    quiz: { type: Schema.Types.Mixed } // Array of { question: string, options: string[], answer: string }
}, { timestamps: true });
// Index for faster queries within an organization and hierarchy
DocumentSchema.index({ orgId: 1, parentDocument: 1 });
DocumentSchema.index({ userId: 1 });

export default mongoose.model<IDocument>('document', DocumentSchema);