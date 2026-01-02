import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Document from '../models/Document';
import mongoose from 'mongoose';
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
        const { title, content, coverImage, icon, isPublished, isArchived } = req.body;
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
        const updatedDoc = await doc.save();
        res.json(updatedDoc);
    } catch (error) {
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