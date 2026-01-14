
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { Pinecone } from '@pinecone-database/pinecone';

async function test() {
    try {
        console.log("Initializing Pinecone...");
        console.log("API Key found:", !!process.env.PINECONE_API_KEY);
        console.log("Index Name:", process.env.PINECONE_INDEX);

        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });

        console.log("Listing indexes...");
        const indexes = await pc.listIndexes();
        console.log("Indexes found:", JSON.stringify(indexes, null, 2));

        const indexName = process.env.PINECONE_INDEX;
        const index = pc.Index(indexName);

        console.log("Fetching index stats...");
        const stats = await index.describeIndexStats();
        console.log("Index stats:", JSON.stringify(stats, null, 2));

    } catch (error) {
        console.error("Pinecone health check failed:", error);
    }
}

test();
