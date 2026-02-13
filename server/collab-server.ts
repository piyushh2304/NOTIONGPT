import { Server } from '@hocuspocus/server';

// Simple in-memory server for now, but scalable

// Initialize the server
const collabServer = new Server({
    port: Number(process.env.COLLAB_PORT) || 1234, // Run on port 1234 or env.COLLAB_PORT
    name: 'hocuspocus',
    extensions: [],
    onConnect: async (data) => {
        console.log(`[Collab] User connected to document: ${data.documentName}`);
    },
    onDisconnect: async (data) => {
        console.log(`[Collab] User disconnected from document: ${data.documentName}`);
    },
    // We can add onStoreDocument hooks here later to save back to MongoDB
});

export const startCollabServer = async () => {
    try {
        await collabServer.listen();
        console.log('[Collab] WebSocket server running on port 1234');
    } catch (error) {
        console.error('[Collab] Failed to start WebSocket server:', error);
    }
}
