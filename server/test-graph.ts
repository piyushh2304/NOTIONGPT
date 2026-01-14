
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { pineconeIndex } from './lib/vector-store.js';
import { getEmbeddings } from './lib/embeddings.js';

async function test() {
    try {
        console.log("Testing embeddings...");
        const embedding = await getEmbeddings("Test title");
        console.log("Embedding generated successfully. Length:", embedding.length);

        console.log("Testing Pinecone query...");
        const searchResponse = await pineconeIndex.query({
            vector: embedding,
            topK: 1,
            filter: { orgId: "default-org" },
            includeMetadata: true
        });
        console.log("Pinecone query successful. Matches:", searchResponse.matches.length);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
