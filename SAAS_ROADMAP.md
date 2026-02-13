# SaaS Feature Roadmap

Turning your document app into a sellable SaaS requires distinguishing between "Core/Free" features and "Premium/Pro" value drivers.

## 📦 Tier 1: The "Must-Haves" (Baseline SaaS)
*These features make the app a viable competitor to Notion/Obsidian.*

### 1. 🤝 Real-Time Collaboration (Multiplayer)
**Current Status:** Not implemented (Local state only).
**Implementation:**
- **Tech:** Update `editor.tsx` to use **Y.js** with `tiptap-extension-collaboration`.
- **Backend:** Add a WebSocket server (`hocuspocus` or `socket.io`) to sync document states instantly.
- **Value:** Teams cannot use the app without this. It is the #1 requirement for B2B sales.

### 2. 🌍 Public Publishing
**Current Status:** `isPublic` flag exists in DB, but no dedicated public view or verified routes.
**Implementation:**
- **Public Routes:** Create a generic read-only layout (no sidebar/editor) for `http://app.com/p/:documentId`.
- **SEO:** Server-side rendering (SSR) or proper meta tags for public pages so they rank on Google.
- **Custom Domains (Pro):** Allow users to map `docs.theircompany.com` to your app (High value).

### 3. 📝 Structured Database Views (Kanban/Table)
**Current Status:** Text editor exists. `KanbanBoardExtension` is imported but needs full integration.
**Implementation:**
- Allow "Database" documents that aren't just text, but rows of data.
- Views: Table, Board (Kanban), Calendar.
- **Why?** This is what makes Notion powerful for project management, not just note-taking.

---

## 💎 Tier 2: The "Premium" Monetization Features
*These are the specific reasons users will upgrade to a paid plan.*

### 4. 🧠 Advanced AI "Study Partner"
**Current Status:** Basic Chat & Synthesis exist.
**Implementation:**
- **"Quiz Me" Mode:** AI generates a quiz from the document and tracks scores (perfect for Students/EdTech).
- **Auto-Flashcards:** One-click generation of Anki-style flashcards from notes.
- **Repository Chat:** "Chat with my entire workspace" (RAG across all docs, not just one). *Already partially there with Pinecone, needs specific UI.*

### 5. 🤖 Workflow Automations
**Current Status:** None.
**Implementation:**
- **Webhooks:** "When a document is updated, send message to Slack."
- **Email Digest:** Daily/Weekly AI summaries of changes in the team's workspace.
- **Recurring Tasks:** Auto-create review tasks based on Spaced Repetition (SRS) logic.

### 6. 🔒 Enterprise Security & Control
**Current Status:** Basic Google Auth.
**Implementation:**
- **Granular Permissions:** "Can Comment" vs "Can Edit" vs "Can View".
- **Version History:** Time-travel back to previous versions of a document (30-day history for Pro).
- **Audit Logs:** See who viewed/edited what and when.

---

## 🚀 Recommended Implementation Order

1.  **Fix Public Publishing** (Low effort, high marketing value).
2.  **Implement Real-Time Collaboration** (High effort, critical for "Teams" plan).
3.  **Refine AI into "Study Tools"** (Unique selling point for specific niche: Students/Researchers).
