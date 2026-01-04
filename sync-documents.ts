
import 'dotenv/config';
import { connectDB } from './server/db';
import Document from './server/models/Document';
import { syncDocumentToPinecone } from './server/lib/sync-to-pinecone';
import mongoose from 'mongoose';

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const documents = await Document.find({});
        console.log(`Found ${documents.length} documents to sync.`);

        for (const doc of documents) {
            if (doc.content) {
                console.log(`Syncing doc: ${doc.title} (${doc._id})`);
                try {
                    await syncDocumentToPinecone(doc.id, doc.content, {
                        title: doc.title,
                        orgId: doc.orgId.toString()
                    });
                } catch (e) {
                    console.error(`Failed to sync doc ${doc.id}:`, e);
                }
            } else {
                console.log(`Skipping empty doc: ${doc.title}`);
            }
        }

        console.log('Sync complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing documents:', error);
        process.exit(1);
    }
};

run();
