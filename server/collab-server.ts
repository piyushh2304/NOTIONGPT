import { Server } from '@hocuspocus/server';

// Simple in-memory server for now, but scalable

// Initialize the server
export const collabServer = new Server({
    name: 'notiongpt-collab',
    extensions: [],
    onConnect: async (data) => {
        console.log(`[Collab] User connected to document: ${data.documentName}`);
    },
    onDisconnect: async (data) => {
        console.log(`[Collab] User disconnected from document: ${data.documentName}`);
    },
});

export const startCollabServer = async () => {
    // Port 1234 is still the default for standalone dev mode if needed
    const port = Number(process.env.COLLAB_PORT) || 1234;
    try {
        await collabServer.listen(port);
        console.log(`[Collab] Standalone server running on port ${port}`);
    } catch (error) {
        console.error('[Collab] Failed to start standalone server:', error);
    }
}
