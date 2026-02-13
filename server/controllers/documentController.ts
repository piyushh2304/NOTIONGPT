import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Document from '../models/Document';
import Organization from '../models/Organization';
import mongoose from 'mongoose';
import { syncDocumentToPinecone } from '../lib/sync-to-pinecone';

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { title, parentDocument, orgId } = req.body;
        console.log('[Debug] createDocument body:', req.body);

        if (!orgId || !mongoose.Types.ObjectId.isValid(orgId as string)) {
            // Fallback: If orgId isn't in body, try to find it from the user's current organization
            // This covers cases where the frontend hasn't refreshed the user context yet.
            const userId = req.user.id || req.user._id;

            let userOrg = null;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userOrg = await Organization.findOne({ 'members.userId': new mongoose.Types.ObjectId(userId) });
            }

            if (!userOrg) {
                // Try string match just in case
                userOrg = await Organization.findOne({ 'members.userId': userId });
            }

            if (!userOrg) {
                console.error('[Debug] createDocument 400 - Org not found for user:', userId, req.user);
                return res.status(400).json({ message: 'Organization ID is required and could not be determined' });
            }
            req.body.orgId = userOrg._id;
            console.log('[Debug] Found org fallback:', userOrg._id);
        }

        const docData: any = {
            title: title || 'Untitled',
            userId: req.user.id || req.user._id,
            orgId: req.body.orgId || orgId,
            isArchived: false,
            isPublished: false,
        };

        if (parentDocument && mongoose.Types.ObjectId.isValid(parentDocument as string)) {
            docData.parentDocument = parentDocument;
        } else {
            docData.parentDocument = null;
        }

        const doc = await Document.create(docData);

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
        console.log('[Debug] getDocuments called');
        console.log('[Debug] Query:', req.query);
        console.log('[Debug] User:', req.user);
        const { orgId, parentDocument, isArchived } = req.query;

        // Fetch documents for the org if provided, otherwise for the user
        let filter: any = {};

        if (orgId && orgId !== 'undefined' && orgId !== 'null' && mongoose.Types.ObjectId.isValid(orgId as string)) {
            filter.orgId = orgId;
        } else if (req.user?.id || req.user?._id) {
            filter.userId = req.user.id || req.user._id;
        } else {
            console.error('[Debug] getDocuments 400 - req.user:', req.user, 'orgId:', orgId);
            return res.status(400).json({ message: 'User ID or Org ID is required' });
        }

        if (parentDocument === 'null' || parentDocument === 'undefined' || parentDocument === undefined) {
            filter.parentDocument = null;
        } else if (mongoose.Types.ObjectId.isValid(parentDocument as string)) {
            filter.parentDocument = parentDocument;
        }

        if (isArchived !== undefined) {
            filter.isArchived = isArchived === 'true';
        } else {
            filter.isArchived = { $ne: true };
        }

        console.log('[Debug] computed filter:', filter);
        const documents = await Document.find(filter).sort({ createdAt: -1 });
        console.log('[Debug] documents found:', documents.length);
        res.json(documents);
    } catch (error: any) {
        console.error("Error in getDocuments:", error);
        res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
};
// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching document', error });
    }
};

// @desc    Get public document (no auth required)
// @route   GET /api/documents/public/:id
// @access  Public
export const getPublicDocument = async (req: any, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!doc.isPublic) {
            return res.status(403).json({ message: 'This document is private' });
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
        const { title, content, coverImage, icon, isPublished, isArchived, isPublic, collaborators, recurrence, flashcards, mindmap, quiz, studyPlan, codingQuestions, lastReviewedAt, nextReviewAt, masteryLevel } = req.body;
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (title !== undefined) doc.title = title || 'Untitled';
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
        if (collaborators !== undefined) doc.collaborators = collaborators;
        if (recurrence !== undefined) doc.recurrence = recurrence;
        if (flashcards !== undefined) (doc as any).flashcards = flashcards;
        if (mindmap !== undefined) (doc as any).mindmap = mindmap;
        if (quiz !== undefined) (doc as any).quiz = quiz;
        if (studyPlan !== undefined) (doc as any).studyPlan = studyPlan;
        if (codingQuestions !== undefined) (doc as any).codingQuestions = codingQuestions;
        if (lastReviewedAt !== undefined) (doc as any).lastReviewedAt = lastReviewedAt;
        if (nextReviewAt !== undefined) (doc as any).nextReviewAt = nextReviewAt;
        if (masteryLevel !== undefined) (doc as any).masteryLevel = masteryLevel;
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid document ID' });
        }
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

// @desc    Search documents
// @route   POST /api/documents/search
// @access  Private
export const searchDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const { query, orgId } = req.body;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        let filter: any = {
            isArchived: { $ne: true },
            $text: { $search: query }
        };

        if (orgId && mongoose.Types.ObjectId.isValid(orgId as string)) {
            filter.orgId = orgId;
        } else if (req.user?.id) {
            filter.userId = req.user.id;
        }

        const results = await Document.find(filter)
            .select('title _id icon')
            .limit(10); // Limit to 10 results for performance

        res.json(results.map(doc => ({
            id: doc._id,
            title: doc.title,
            icon: doc.icon
        })));
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Search failed", error });
    }
};