# NotionGPT - AI-Powered Collaborative Workspace

NotionGPT is a next-generation collaborative document editor powered by AI, featuring real-time editing, semantic search, and intelligent content generation.

## 🚀 Features

- **Collaborative Editor**: Real-time multi-user editing powered by Tiptap and Yjs.
- **AI-Powered Workflows**: Generate documents, summaries, mind maps, and quizzes directly from your content.
- **Semantic Search**: Context-aware search across all your documents using Pinecone vector database.
- **Web Search Integration**: AI can fetch and synthesize information from the live web using Tavily.
- **Masterpiece Mode**: Detects intent and automatically synthesizes comprehensive documents with embedded visuals.
- **Organization Support**: Manage documents within workspaces and teams.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Radix UI.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Drizzle ORM (Postgres ready).
- **AI/ML**: LangChain, Google Gemini (GenAI), Pinecone (Vector DB), Tavily (Search API).
- **Collaboration**: Hocuspocus (Yjs server).

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Google Cloud Platform account (for Gemini API)
- Pinecone account (for semantic search)
- Tavily account (for web search)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd NOTIONGPT
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your API keys.
   ```bash
   cp .env.example .env
   ```

4. **Initialize the database**:
   ```bash
   npm run db:push
   ```

5. **Run in development**:
   ```bash
   # Starts both frontend (Vite) and backend (Express)
   npm run dev:all
   ```

### 🚢 Deployment

The application is ready for production deployment.

1. **Build the frontend**:
   ```bash
   npm run build
   ```
   This generates a `dist` folder.

2. **Configure production environment**:
   Ensure `NODE_ENV` is set to `production`. The server will automatically serve the built frontend from the `dist` folder.

3. **Start the server**:
   ```bash
   npm start
   ```

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT authentication |
| `GOOGLE_API_KEY` | Google Gemini API Key |
| `TAVILY_API_KEY` | Tavily Search API Key |
| `PINECONE_API_KEY` | Pinecone API Key |
| `PINECONE_INDEX` | Pinecone Index Name |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth Redirect URI |
| `COLLAB_PORT` | Collaboration server port (default: 1234) |

## 📄 License

MIT
