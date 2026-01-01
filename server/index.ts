import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { connectDB } from "./db"
import dotenv from "dotenv"
dotenv.config()
import cookieparser from "cookie-parser"
import authRoutes from "./routes/auth"
import documentRoutes from "./routes/documents"


const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT)

connectDB();

//middleware

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})