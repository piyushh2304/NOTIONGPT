import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Document from '../models/Document';
import mongoose from 'mongoose';
import { syncDocumentToPinecone } from '../lib/sync-to-pinecone';
// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { title, parentDocument, orgId } = req.body;
        const doc = await Document.create({
            title: title || 'Untitled',
            parentDocument: parentDocument || null,
            userId: req.user.id,
            orgId: orgId,
            isArchived: false,
            isPublished: false,
        });

        // Sync to Pinecone (Fire and forget, or await if strictly needed)
        // We don't want to block the user response too long, but for now await is safer to debug errors.
        if (doc.content) {
            await syncDocumentToPinecone(doc.id, doc.content, { title: doc.title, orgId: doc.orgId.toString() });
        }

        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error creating document', error });
    }
};
// @desc    Get all documents for an organization (or user)
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const { orgId, parentDocument, isArchived } = req.query;

        const filter: any = { userId: req.user.id };

        if (orgId) filter.orgId = orgId;

        if (parentDocument === 'null' || parentDocument === undefined) {
            if (parentDocument === 'null') filter.parentDocument = null;
        } else {
            filter.parentDocument = parentDocument;
        }
        if (isArchived !== undefined) {
            filter.isArchived = isArchived === 'true';
        } else {
            filter.isArchived = false;
        }
        const documents = await Document.find(filter).sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
};
// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req: AuthRequest, res: Response) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching document', error });
    }
};
// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, coverImage, icon, isPublished, isArchived, isPublic, allowedUsers, flashcards, mindmap, quiz } = req.body;
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (title !== undefined) doc.title = title;
        if (content) {
            try {
                // If content is sent as a string (frontend behavior), parse it to store as Object
                doc.content = typeof content === 'string' ? JSON.parse(content) : content;
            } catch (e) {
                console.error("Error parsing content JSON", e);
                doc.content = content; // Fallback
            }
        }
        if (coverImage !== undefined) doc.coverImage = coverImage;
        if (icon !== undefined) doc.icon = icon;
        if (isPublished !== undefined) doc.isPublished = isPublished;
        if (isArchived !== undefined) doc.isArchived = isArchived;
        if (isPublic !== undefined) doc.isPublic = isPublic;
        if (allowedUsers !== undefined) doc.allowedUsers = allowedUsers;
        if (flashcards !== undefined) (doc as any).flashcards = flashcards;
        if (mindmap !== undefined) (doc as any).mindmap = mindmap;
        if (quiz !== undefined) (doc as any).quiz = quiz;
        const updatedDoc = await doc.save();

        // Sync to Pinecone
        // We sync if content or title changed
        if (content || title) {
            try {
                await syncDocumentToPinecone(updatedDoc.id, updatedDoc.content, { title: updatedDoc.title, orgId: updatedDoc.orgId.toString() });
            } catch (syncError) {
                console.error("Non-fatal error syncing to Pinecone:", syncError);
                // Do NOT rethrow, so the document save succeeds
            }
        }

        res.json(updatedDoc);
    } catch (error) {
        console.error("Error in updateDocument:", error);
        res.status(500).json({ message: 'Error updating document', error });
    }
};
// @desc    Archive (Soft delete) document
// @route   DELETE /api/documents/:id
// @access  Private
export const archiveDocument = async (req: AuthRequest, res: Response) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        doc.isArchived = true;
        await doc.save();
        res.json({ message: 'Document archived' });
    } catch (error) {
        res.status(500).json({ message: 'Error archiving document', error });
    }
};