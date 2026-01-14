
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

        console.log("Testing Pinecone query with filter...");
        const safeOrgId = "default-org"; // Common fallback

        const searchResponse = await pineconeIndex.query({
            vector: embedding,
            topK: 5,
            filter: { orgId: safeOrgId }, // THIS MIGHT BE THE PROBLEM IF NOT INDEXED
            includeMetadata: true
        });

        console.log("Matches found:", searchResponse.matches.length);
        if (searchResponse.matches.length > 0) {
            console.log("First match metadata:", JSON.stringify(searchResponse.matches[0].metadata, null, 2));
        } else {
            console.log("No matches found with filter. Trying without filter...");
            const noFilterRes = await pineconeIndex.query({
                vector: embedding,
                topK: 5,
                includeMetadata: true
            });
            console.log("Matches without filter:", noFilterRes.matches.length);
            if (noFilterRes.matches.length > 0) {
                console.log("Sample metadata (no filter):", JSON.stringify(noFilterRes.matches[0].metadata, null, 2));
            }
        }
    } catch (error) {
        console.error("Test failed!");
        console.error(error);
    }
}

test();
