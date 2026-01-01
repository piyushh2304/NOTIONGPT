
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
    createdAt: string;
    updatedAt: string;
};

export const useDocuments = () => {
    const { user } = useAuth();

    const getDocuments = async (parentDocumentId: string | null = null) => {
        try {
            const query = parentDocumentId ? `?parentDocument=${parentDocumentId}` : `?parentDocument=null`;
            const response = await fetch(`/api/documents${query}`, {
               headers: { 'Content-Type': 'application/json' },
               credentials: 'include' 
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return data as Document[];
        } catch (error) {
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
            
            const newDoc = await response.json();
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
            const updated = await response.json();
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
            const data = await response.json();
            return data as Document;
         } catch (error) {
             // toast.error("Failed to load document"); // validation might fail on first load if redirecting
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

    return {
        getDocuments,
        createDocument,
        updateDocument,
        archiveDocument,
        duplicateDocument,
        getDocument
    };
};
