
import { getEmbeddings } from './lib/embeddings.js';

async function test() {
    try {
        console.log("Starting embedding test...");
        const start = Date.now();
        const embedding = await getEmbeddings("Hello world");
        const end = Date.now();
        console.log("Success! Embedding length:", embedding.length);
        console.log("Time taken:", end - start, "ms");
        console.log("First 5 values:", embedding.slice(0, 5));
    } catch (error) {
        console.error("Embedding test failed!");
        console.error(error);
    }
}

test();
