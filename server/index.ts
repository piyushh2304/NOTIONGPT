
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"
import { fileURLToPath } from "url"
import { connectDB } from "./db"
import dotenv from "dotenv" // Removed manual config
dotenv.config()
import authRoutes from "./routes/auth"
import documentRoutes from "./routes/documents"
import aiRoutes from "./routes/ai"
import reviewRoutes from "./routes/review"
import researchRoutes from "./routes/research"
import integrationRoutes from "./routes/integrations"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT)



app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
    // res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/integrations', integrationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    app.get(/(.*)/, (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });

} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

import { collabServer } from "./collab-server";
import { initRecurrenceWorker } from "./workers/recurrence";
import http from "http";
import { WebSocketServer } from 'ws';

const startServer = async () => {
    try {
        await connectDB();
        console.log("DB Connected, starting server...");

        initRecurrenceWorker();

        const server = http.createServer(app);

        // Create a WebSocket server that doesn't start its own server
        const wss = new WebSocketServer({ noServer: true });

        // Attach Hocuspocus to the same HTTP server
        server.on('upgrade', (request, socket, head) => {
            wss.handleUpgrade(request, socket, head, (ws) => {
                collabServer.hocuspocus.handleConnection(ws, request);
            });
        });

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Collab server attached to the same port.`);
        }).on('error', (err) => {
            console.error("Server failed to start:", err);
        });
    } catch (error) {
        console.error("Failed to connect to DB:", error);
    }
};

startServer();
