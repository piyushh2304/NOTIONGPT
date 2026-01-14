import "dotenv/config" // Must be first
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"
import { fileURLToPath } from "url"
import { connectDB } from "./db"
// import dotenv from "dotenv" // Removed manual config
// dotenv.config()
import authRoutes from "./routes/auth"
import documentRoutes from "./routes/documents"
import aiRoutes from "./routes/ai"
import graphRoutes from "./routes/graph"
import reviewRoutes from "./routes/review"
import researchRoutes from "./routes/research"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT)



app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/research', researchRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

const startServer = async () => {
    try {
        await connectDB();
        console.log("DB Connected, starting server...");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        }).on('error', (err) => {
            console.error("Server failed to start:", err);
        });
    } catch (error) {
        console.error("Failed to connect to DB:", error);
    }
};

startServer();
