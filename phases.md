# Project Phases: NotionGPT

This roadmap outlines the development phases for building a Notion clone with Intercom and ChatGPT features.

## Phase 1: Foundation & UI Shell 🏗️
**Goal:** Initialize repo, UI framework, and core layout.
**Tech:** React 19 (Vite or CRA), Tailwind, shadcn/ui.
- [x] Landing page
- [x] Dashboard layout shell (sidebar + topbar)
- [x] Client-side routes defined (no backend calls yet) using React Router
- [x] **Deliverable:** Functional UI shell and landing page.

## Phase 2: Database & Authentication 🔐
**Goal:** User & organization management with secure auth.
**Tech:** MongoDB (Atlas/Local), Mongoose ODM, JWT auth -> OAuth later.
- [x] Signup, Login, Logout
- [x] Organization creation
- [x] JWT session handling
- [x] Protected routes middleware in Express
- [x] **Deliverable:** Secure auth and org management.

## Phase 2.1: Frontend Authentication (UI Integration)
**Goal:** Create beautiful Sign In and Sign Up pages.
**Tech:** React, Framer Motion, Lucide React, Custom UI.
- [x] Login Page with animation (DotMap backend).
- [x] Signup Page (adapted from Login UI).
- [x] Auth Context for frontend state management.
- [x] Integration with backend API.
- [x] **Deliverable:** Complete Frontend Auth Flow.


## Phase 3: Knowledge Base (The "Notion" Part) �
**Goal:** Document creation & management.
**Tech:** Tiptap (advanced extensions), Mongoose CRUD, Recursive tree structure.
- [ ] Create, Edit, Delete, View documents
- [ ] Tree structure stored via parentId reference
- [ ] API endpoints for docs + org scope validation
- [ ] **Deliverable:** Basic document management.

## Phase 3.1: Notion-like Editor & Dashboard Experience 🎨
**Goal:** Make the writing experience feel like Notion.
**Tech:** Tiptap extensions, Optimistic UI, Mongo recursive aggregation.
- [ ] Notion-like editor page (always main view)
- [ ] Tree sidebar navigation (collapsible, infinite depth)
- [ ] Slash commands menu (`/`)
- [ ] Block-based UX (Drag handles, draggable blocks)
- [ ] Page properties (Cover images + Icons)
- [ ] Autosave (Debounced)
- [ ] **Deliverable:** Comprehensive Notion editor experience.

## Phase 4: Support & Tickets (The "Intercom" Part) 🎫
**Goal:** Manual support system.
**Tech:** MongoDB Ticket Schema, Express REST API, React dashboard.
- [ ] Create ticket (user side)
- [ ] Reply to ticket (agent side)
- [ ] Agent dashboard UI
- [ ] **Deliverable:** Functional support ticket system.

## Phase 5: AI Intelligence (The "ChatGPT" Part) 🤖
**Goal:** Build RAG + AI support chat.
**Tech:** LangChain.js, Pinecone/pgvector, OpenAI/Gemini API.
- [ ] AI chat widget (company docs context)
- [ ] Vector embeddings pipeline
- [ ] Automated AI replies/suggestions
- [ ] **Deliverable:** AI-powered support and chat.

## Phase 6: Microservices & Refinement 🚀
**Goal:** Modularize backend when scaling is needed.
**Tech:** Optional NestJS/Express services, GraphQL Gateway, Redis.
- [ ] Split backend into Docs, Auth, Support, AI services (if needed)
- [ ] API Structure alignment
- [ ] **Deliverable:** Scalable architecture.

## API Backend Structure Reference
| Feature | Endpoint |
| :--- | :--- |
| Auth | `/api/auth/signup`, `/api/auth/login` |
| Org | `/api/org/create`, `/api/org/:orgId` |
| Docs | `/api/docs/create`, `/api/docs/:id`, `/api/docs/tree/:orgId` |
| Support | `/api/tickets/create`, `/api/tickets/:id/reply` |
| AI | `/api/ai/chat`, `/api/ai/embed-docs` |
