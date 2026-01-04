import "dotenv/config" // Must be first
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { connectDB } from "./db"
// import dotenv from "dotenv" // Removed manual config
// dotenv.config()
import authRoutes from "./routes/auth"
import documentRoutes from "./routes/documents"
import aiRoutes from "./routes/ai"

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

app.get('/', (req, res) => {
    res.send('API is running...');
});

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
