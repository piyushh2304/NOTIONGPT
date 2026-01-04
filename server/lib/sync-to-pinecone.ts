
import { pineconeIndex } from "./vector-store";
import { getEmbeddings, splitTextIntoChunks } from "./embeddings";
import { Document } from "@langchain/core/documents";

// Helper to extract plain text from Tiptap JSON
export function extractTextFromTiptap(content: any): string {
    if (!content) return "";
    if (typeof content === 'string') return content; // Fallback if still string

    let text = "";

    if (content.type === 'text' && content.text) {
        text += content.text;
    }

    if (content.content && Array.isArray(content.content)) {
        content.content.forEach((child: any) => {
            text += extractTextFromTiptap(child) + " ";
        });
    }

    return text.trim();
}

export async function syncDocumentToPinecone(docId: string, contentJson: any, metadata: { title: string, orgId: string }) {
    try {
        console.log(`Syncing document ${docId} to Pinecone...`);

        // 1. Extract text
        const plainText = extractTextFromTiptap(contentJson);
        if (!plainText) {
            console.log("No text content to sync.");
            return;
        }

        // 2. Split into chunks
        // We use splitTextIntoChunks which returns LangChain Documents
        const chunks = await splitTextIntoChunks(plainText);

        // 3. Prepare vectors for Pinecone
        // Pinecone expects: { id, values: number[], metadata }
        const vectors = await Promise.all(chunks.map(async (chunk: Document, i: number) => {
            const embedding = await getEmbeddings(chunk.pageContent);

            // Construct metadata
            const recordMetadata = {
                docId,
                title: metadata.title,
                orgId: metadata.orgId,
                text: chunk.pageContent, // Store text so we can retrieve it later for RAG context
                chunkIndex: i
            };

            return {
                id: `${docId}_${i}`,
                values: embedding,
                metadata: recordMetadata
            };
        }));

        // 4. Batch upsert to Pinecone
        // Pinecone allows batch upsarts.
        await pineconeIndex.upsert(vectors);

        console.log(`Successfully synced ${vectors.length} chunks for doc ${docId}`);

    } catch (error) {
        console.error("Error syncing to Pinecone:", error);
    }
}
