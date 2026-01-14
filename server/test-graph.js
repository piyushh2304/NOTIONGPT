
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { pineconeIndex } = require('./lib/vector-store');
const { getEmbeddings } = require('./lib/embeddings');

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
