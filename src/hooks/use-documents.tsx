
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export type Document = {
    _id: string;
    title: string;
    userId: string;
    orgId: string;
    parentDocument?: string | null;
    content?: string;
    icon?: string;
    coverImage?: string;
    isArchived: boolean;
    isPublished: boolean;
    isPublic: boolean;
    allowedUsers: string[];
    createdAt: string;
    updatedAt: string;
    flashcards?: Array<{ front: string, back: string }>;
    mindmap?: { initialNodes: any[], initialEdges: any[] };
    quiz?: Array<{ question: string, options: string[], answer: string }>;
    studyPlan?: any;
    codingQuestions?: any[];
    lastReviewedAt?: string;
    nextReviewAt?: string;
    masteryLevel?: number;
};

export const useDocuments = () => {
    const { user } = useAuth();

    const getDocuments = async (parentDocumentId: string | null = null) => {
        try {
            let query = parentDocumentId ? `?parentDocument=${parentDocumentId}` : `?parentDocument=null`;
            if (user?.orgId) {
                query += `&orgId=${user.orgId}`;
            }
            const response = await fetch(`/api/documents${query}`, {
               headers: { 'Content-Type': 'application/json' },
               credentials: 'include' 
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            
            // Cache the list
            try {
                const cacheKey = `documents_list_${parentDocumentId || 'root'}_${user?.orgId || 'personal'}`;
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to cache document list', e);
            }

            return data as Document[];
        } catch (error) {
            console.error("Fetch failed, trying cache", error);
            try {
                const cacheKey = `documents_list_${parentDocumentId || 'root'}_${user?.orgId || 'personal'}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    toast.info("Using offline data");
                    return JSON.parse(cached) as Document[];
                }
            } catch (e) {
                console.error("Cache read failed", e);
            }

            toast.error("Failed to load documents");
            return [];
        }
    };

    const createDocument = async (title: string, parentDocument?: string) => {
        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    title, 
                    parentDocument, 
                    orgId: user?.orgId 
                })
            });
            
            if (!response.ok) throw new Error('Failed to create');
            
            const text = await response.text();
            const newDoc = text ? JSON.parse(text) : null;
            toast.success("Document created");
            return newDoc;
        } catch (error) {
            toast.error("Failed to create document");
            throw error;
        }
    };
    
    const updateDocument = async (id: string, updates: Partial<Document>) => {
        try {
            const response = await fetch(`/api/documents/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update');
            const text = await response.text();
            const updated = text ? JSON.parse(text) : null;
            return updated;
        } catch (error) {
            toast.error("Something went wrong");
            throw error;
        }
    };

    const archiveDocument = async (id: string) => {
         try {
            const response = await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
             if (!response.ok) throw new Error('Failed to archive');
             toast.success("Document moved to trash");
             return true;
         } catch (error) {
             toast.error("Failed to delete");
             throw error;
         }
    };

    // Helper to get single document
    const getDocument = async (id: string) => {
         try {
            const response = await fetch(`/api/documents/${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const text = await response.text();
            const data = text ? JSON.parse(text) : null;
            
            if (data) {
                try {
                    localStorage.setItem(`document_meta_${id}`, JSON.stringify(data));
                } catch (e) {
                    console.warn('Failed to cache document', e);
                }
            }
            
            return data as Document;
         } catch (error) {
             console.error("Fetch failed", error);
             try {
                const cached = localStorage.getItem(`document_meta_${id}`);
                if (cached) {
                    return JSON.parse(cached) as Document;
                }
             } catch (e) {
                 console.error("Cache read failed", e);
             }
             return null;
         }
    };

    const duplicateDocument = async (originalDoc: Document) => {
        try {
            const newDoc = await createDocument(`Copy of ${originalDoc.title}`, originalDoc.parentDocument || undefined);
            if (!newDoc) throw new Error("Failed to create duplicate");

            // Update content/meta
            await updateDocument(newDoc._id, {
                content: originalDoc.content,
                icon: originalDoc.icon,
                coverImage: originalDoc.coverImage,
            });
            
            toast.success("Document duplicated");
            return newDoc;
        } catch (error) {
            toast.error("Failed to duplicate");
            throw error;
        }
    };

    const getAllDocuments = async () => {
        try {
            // No parentDocument query param = fetch all for the org
            const query = user?.orgId ? `?orgId=${user.orgId}` : "";
            const response = await fetch(`/api/documents${query}`, {
               headers: { 'Content-Type': 'application/json' },
               credentials: 'include' 
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            return data as Document[];
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    return {
        getDocuments,
        getAllDocuments,
        createDocument,
        updateDocument,
        archiveDocument,
        duplicateDocument,
        getDocument
    };
};
