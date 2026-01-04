import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const run = async () => {
    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        const indexName = process.env.PINECONE_INDEX!;

        console.log(`Checking Pinecone index: ${indexName}...`);

        const index = pinecone.Index(indexName);

        // Get index stats
        const stats = await index.describeIndexStats();

        console.log('Index Stats:', JSON.stringify(stats, null, 2));

        console.log('Successfully connected to Pinecone!');
    } catch (error) {
        console.error('Error connecting to Pinecone:', error);
        process.exit(1);
    }
};

run();
