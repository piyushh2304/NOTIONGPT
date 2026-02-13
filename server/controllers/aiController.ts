import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { pineconeIndex } from '../lib/vector-store';
import { getEmbeddings } from '../lib/embeddings';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import Chat from '../models/Chat';
import Document from '../models/Document';
import { AnalogySearchService } from '../services/analogySearchService';
import { WorkspaceSynthesisService } from '../services/workspaceSynthesisService';
import { AuthRequest } from '../middleware/auth';

import { IDocument } from '../models/Document';
import { syncDocumentToPinecone } from '../lib/sync-to-pinecone';

// Utility to attempt repairing truncated or malformed JSON
function repairJson(json: string): any {
    try {
        return JSON.parse(json);
    } catch (e) {
        console.log("[repairJson] Parsing failed, attempting repair...");

        let repaired = json.trim();

        // Remove everything after the last valid structure if we can't find a closing bracket
        // This is a simple heuristic: count braces
        let openBraces = (repaired.match(/\{/g) || []).length;
        let closeBraces = (repaired.match(/\}/g) || []).length;
        let openBrackets = (repaired.match(/\[/g) || []).length;
        let closeBrackets = (repaired.match(/\]/g) || []).length;

        // Try appending missing closers
        while (openBraces > closeBraces) {
            repaired += "}";
            closeBraces++;
        }
        while (openBrackets > closeBrackets) {
            repaired += "]";
            closeBrackets++;
        }

        try {
            return JSON.parse(repaired);
        } catch (innerError) {
            // If simple repair fails, try to find the last complete object in a truncated array
            // This is harder, so let's try a substring approach
            console.warn("[repairJson] Simple repair failed, content might be too mangled.");
            throw innerError;
        }
    }
}

export const chatWithDocs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message, orgId, chatId } = req.body;

        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        // Ensure orgId is a valid ObjectId
        let safeOrgId: string | mongoose.Types.ObjectId = orgId;

        if (!orgId || orgId === "default-org" || !mongoose.Types.ObjectId.isValid(orgId)) {
            console.log(`[aiController] Invalid orgId "${orgId}" received. Attempting to resolve via User...`);
            const Organization = mongoose.model('Organization');
            const userOrg = await Organization.findOne({ 'members.userId': req.user.id });
            if (userOrg) {
                safeOrgId = userOrg._id as mongoose.Types.ObjectId;
                console.log(`[aiController] Resolved orgId to: ${safeOrgId}`);
            } else {
                console.warn(`[aiController] No organization found for user ${req.user.id}. Falling back to default.`);
                // If really no org, we might have to fail or use a global one, 
                // but for now let's hope one exists or we create one.
                res.status(400).json({ error: "User is not associated with any organization." });
                return;
            }
        }

        console.log(`Received chat message: "${message}" for org: ${safeOrgId}`);

        if (!process.env.GOOGLE_API_KEY) {
            console.error("Missing GOOGLE_API_KEY");
            res.status(500).json({ error: "Server configuration error: Missing Google API Key" });
            return;
        }

        // 1. Embed user query
        console.log("Step 1: Generating embeddings (Gemini)...");
        let queryEmbedding;
        try {
            queryEmbedding = await getEmbeddings(message);
        } catch (e: any) {
            console.error("Embedding generation failed:", e.message);
            res.status(500).json({ error: `Embedding generation failed: ${e.message}` });
            return;
        }

        // 2. Query Pinecone AND Tavily Search
        console.log("Step 2: Querying Pinecone and Web Search...");

        let contextText = "";
        let searchResultsText = "";
        let pineconeMatches = 0;


        // Relaxed Filter: Only filter if we have a valid specific orgId
        const filter = (safeOrgId && safeOrgId.toString() !== "default-org")
            ? { orgId: safeOrgId.toString() }
            : undefined;

        const pineconePromise = pineconeIndex.query({
            vector: queryEmbedding,
            topK: 5,
            filter: filter,
            includeMetadata: true
        });

        // Trigger Web Search via Direct Fetch
        const webSearchPromise = fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: message,
                search_depth: "advanced",
                max_results: 5,
                include_images: true
            })
        });

        // Await both with robust error handling
        const [pineconeResult, webResult] = await Promise.allSettled([pineconePromise, webSearchPromise]);

        // Process Pinecone Results
        if (pineconeResult.status === 'fulfilled') {
            const searchResponse = pineconeResult.value;
            pineconeMatches = searchResponse.matches.length;
            console.log(`Pinecone matches found: ${pineconeMatches}`);

            contextText = searchResponse.matches
                .map(match => match.metadata?.text)
                .filter(text => text)
                .join("\n\n---\n\n");
        } else {
            console.error("Pinecone retrieval failed:", pineconeResult.reason);
        }

        if (!contextText) {
            console.log("No relevant context found in Pinecone.");
        }

        let foundImages: string[] = [];
        // Process Web Results
        if (webResult.status === 'fulfilled') {
            try {
                const response = webResult.value;
                if (response.ok) {
                    const data: any = await response.json();
                    if (data.results && Array.isArray(data.results)) {
                        searchResultsText = data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");
                        console.log(`Web search completed with ${data.results.length} results.`);
                    }
                    if (data.images && Array.isArray(data.images)) {
                        foundImages = data.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean);
                        console.log(`Found ${foundImages.length} actual image URLs.`);
                    }
                } else {
                    console.error(`Web search API error: ${response.status}`);
                }
            } catch (err) {
                console.error("Error parsing web search results:", err);
            }
        }

        // 3. Handle Intent Detection & Document Creation
        const creationKeywords = ["create a document", "save this as a note", "make a document", "create a research doc", "create a detailed document"];
        const wantsToCreate = creationKeywords.some(k => message.toLowerCase().includes(k));

        if (wantsToCreate && req.user) {
            console.log("Creation intent detected. Using dedicated document synthesis...");

            // Set headers for status streaming
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.write("🔍 **Detecting Intent & Starting Research...**\n");

            const chatModel = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                model: "gemini-2.5-flash",
                maxOutputTokens: 4096,
                temperature: 0.1,
            });

            res.write("🌐 **Gathering Information & Synthesizing Masterpiece...**\n");

            const synthesisPrompt = `You are an Elite Document Architect and Research Analyst. 
            Your goal is to create a COMPREHENSIVE, DEEP-DIVE document based on the research provided.
            
            User Request: "${message}"
            
            RESEARCH DATA (USE THIS AS THE PRIMARY SOURCE):
            ${searchResultsText || contextText || "Search failed. Use your vast internal knowledge to provide a detailed report."}
            
            Verified Image URLs to use (PRIORITIZE THESE):
            ${foundImages.length > 0 ? foundImages.join("\n") : "None found. Use high-quality Wikimedia Commons URLs."}
            
            STRICT REQUIREMENTS:
            1. **Format**: Output a single JSON object with "title", "coverImage", and "content" (TipTap JSON tree).
            2. **Depth**: The document must be at least 1500 words long. Use deep sections (H1, H2, H3).
            3. **Content Quality**: 
               - DO NOT summarize. Provide detailed explanations, data points, and context.
               - Extract and include relevant links and references from the research data.
               - Include examples, tables (if useful), and detailed paragraphs.
            4. **Visuals**:
               - Use at least 3 images from the verified list or Wikimedia.
               - Choose a beautiful coverImage.
            5. **TipTap Schema**:
               {
                 "type": "doc",
                 "content": [
                   { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "..." }] },
                   { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] },
                   { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "..." }] },
                   { "type": "image", "attrs": { "src": "...", "alt": "..." } },
                   { "type": "bulletList", "content": [{ "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }] }] }
                 ]
               }
            
            Output ONLY raw JSON. No markdown backticks.`;

            try {
                const docResponse = await chatModel.invoke([
                    new SystemMessage(synthesisPrompt),
                    new HumanMessage("Generate the full Masterpiece JSON now.")
                ]);

                const rawJson = typeof docResponse.content === 'string' ? docResponse.content : String(docResponse.content);
                const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();

                let parsed;
                try {
                    parsed = repairJson(cleanJson);
                } catch (parseErr) {
                    console.error("[aiController] Critical JSON Parse Failure:", parseErr);
                    // Fallback to a very simple structure if repair fails
                    parsed = {
                        title: `Research: ${message.substring(0, 30)}`,
                        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: cleanJson }] }] }
                    };
                }

                // Ensure Content is valid TipTap JSON
                let content = parsed.content;

                // 1. If it's just an array of blocks, wrap it
                if (Array.isArray(content)) {
                    content = { type: "doc", content };
                }
                // 2. If it's a single block object (missing doc root), wrap it
                else if (content && typeof content === 'object' && content.type !== "doc") {
                    content = { type: "doc", content: [content] };
                }
                // 3. Fallback: If it's empty, null, or still not a doc object, create a placeholder
                if (!content || typeof content !== 'object' || content.type !== "doc") {
                    console.warn("[aiController] AI returned invalid content structure. Using fallback.", content);
                    content = {
                        type: "doc",
                        content: [
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: typeof content === 'string' ? content : "Content generation failed. Please try again or edit this manually." }]
                            }
                        ]
                    };
                }

                // Final safety: Ensure every node in content array has a type
                if (Array.isArray(content.content)) {
                    content.content = content.content.filter((node: any) => node && typeof node === 'object' && node.type);
                }

                const newDoc = new Document({
                    title: parsed.title || `Research: ${message.substring(0, 20)}`,
                    content: content,
                    coverImage: parsed.coverImage || `https://source.unsplash.com/featured/?${encodeURIComponent(message.substring(0, 20))}`,
                    userId: req.user.id,
                    orgId: safeOrgId.toString(),
                });

                await newDoc.save();

                // Sync to Pinecone for searchability
                try {
                    await syncDocumentToPinecone(newDoc.id, newDoc.content, {
                        title: newDoc.title,
                        orgId: newDoc.orgId.toString()
                    });
                    console.log(`Document ${newDoc.id} synced to Pinecone.`);
                } catch (syncErr) {
                    console.error("Failed to sync AI document to Pinecone:", syncErr);
                }

                const confirmation = `\n✅ **MASTERPIECE CREATED!**\n\nI have generated **"${newDoc.title}"** with a professional structure, embedded visuals, and a custom cover image. \n\nYou can find it in your sidebar and start editing immediately!`;
                res.write(confirmation);
                res.end();

                // Persistence for chat log
                let chatHistory = await Chat.findById(chatId);
                if (!chatHistory) {
                    chatHistory = new Chat({ orgId: safeOrgId, title: newDoc.title, messages: [] });
                }
                chatHistory.messages.push({ role: 'user', content: message });
                chatHistory.messages.push({ role: 'assistant', content: confirmation });
                await chatHistory.save();
                return;
            } catch (err: any) {
                console.error("Document synthesis failed:", err);
                res.write(`\n❌ **Error during synthesis:** ${err.message}`);
                res.end();
                return;
            }
        }

        // 4. Handle Regular Chat Persistence & Streaming
        console.log("Step 4: Standard chat persistence...");
        let chat;
        try {
            if (chatId) {
                chat = await Chat.findById(chatId);
            }
            if (!chat) {
                chat = new Chat({
                    orgId: safeOrgId,
                    title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
                    messages: []
                });
            }
            chat.messages.push({ role: 'user', content: message });
        } catch (e: any) {
            console.error("Chat persistence failed (Mongo):", e);
            res.status(500).json({ error: "Failed to access chat history" });
            return;
        }

        // 5. Normal Streaming Response
        console.log("Step 5: Calling Gemini (Normal Streaming)...");

        try {
            const chatModel = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                model: "gemini-2.5-flash",
                maxOutputTokens: 2048,
            });

            const systemPrompt = `You are an intelligent assistant. 
            Answer the user's question using the provided context.
            
            Synthesize information efficiently from documents and web results.
            Mention if information comes from the web.

            **Context:**
            ${contextText || "No relevant documents."}
            ${searchResultsText || "No web results."}
            `;

            const recentHistory = chat.messages.slice(-6, -1).map((m: any) =>
                m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
            );

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            const stream = await chatModel.stream([
                new SystemMessage(systemPrompt),
                ...recentHistory,
                new HumanMessage(message)
            ]);

            let fullAiResponse = "";
            for await (const chunk of stream) {
                if (chunk.content) {
                    const text = typeof chunk.content === 'string' ? chunk.content : "";
                    fullAiResponse += text;
                    res.write(text);
                }
            }

            res.end();
            chat.messages.push({ role: 'assistant', content: fullAiResponse });
            await chat.save();

        } catch (e: any) {
            console.error("Gemini streaming failed:", e);
            // If headers haven't been sent, we can send a JSON error
            if (!res.headersSent) {
                res.status(500).json({ error: `AI generation failed: ${e.message}` });
            } else {
                res.end(); // Just end the stream if it fails mid-way
            }
        }
    } catch (error) {
        console.error("Error in chatWithDocs:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error processing chat request" });
        }
    }
};

export const getMyChats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.query;
        // In real app, also filter by userId
        const chats = await Chat.find({ orgId }).sort({ updatedAt: -1 }).select('_id title updatedAt');
        res.json({ chats });
    } catch (error) {
        console.error("Error getting chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
}

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const chat = await Chat.findById(id);
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        res.json({ chat });
    } catch (error) {
        console.error("Error getting chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
}

export const deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedChat = await Chat.findByIdAndDelete(id);

        if (!deletedChat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
}

export const generateLearningContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { documentContent, type, customPrompt } = req.body;

        if (!documentContent) {
            res.status(400).json({ error: "Document content is required" });
            return;
        }

        if (!process.env.GOOGLE_API_KEY) {
            res.status(500).json({ error: "Server configuration error: Missing Google API Key" });
            return;
        }

        const chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 4096,
        });

        let systemPrompt = `You are an expert educational content generator. Your goal is to convert the provided document content into high-quality learning material.
        
        Output format: Markdown.
        Ensure the output is well-structured, easy to read, and ready to be pasted into a Notion-like editor.
        `;

        let userPrompt = "";

        if (customPrompt) {
            userPrompt = `Please convert the following content based on these instructions: "${customPrompt}".\n\nContent:\n${documentContent}`;
        } else {
            switch (type) {
                case 'quiz':
                    systemPrompt = `You are an expert educational content generator.
                    IMPORTANT: Output valid JSON only. No markdown.
                    Output format: JSON Array of objects:
                    [{ "question": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct Option Text" }]
                    `;
                    userPrompt = `Generate a multiple-choice quiz (MCQ) based on the following content. 
                    - Create 5-10 questions.
                    - "options" should be an array of 4 distinct string choices.
                    - "answer" must equal exactly one of the options.
                    
                    Content:\n${documentContent}`;
                    break;
                case 'flashcards':
                    systemPrompt = `You are an expert educational content generator.
                    IMPORTANT: Output valid JSON only. No markdown.
                    Output format: JSON Array of objects:
                    [{ "front": "Concept", "back": "Definition" }]
                    `;
                    userPrompt = `Create a set of flashcards from the following content.
                    - Generate 6-12 high quality cards.
                    
                    Content:\n${documentContent}`;
                    break;
                case 'mindmap':
                    systemPrompt = `You are an expert educational content generator.
                    IMPORTANT: Output valid, strict JSON only. No markdown. No trailing commas.
                    Output format: ONE Single Nested JSON Object representing the root node and its children.
                    Structure:
                    {
                      "label": "Central Topic",
                      "children": [
                        { 
                          "label": "Subtopic 1", 
                          "children": [
                             { "label": "Detail A", "children": [] },
                             { "label": "Detail B", "children": [] }
                          ] 
                        },
                        { "label": "Subtopic 2", "children": [] }
                      ]
                    }
                    - Do not include "initialNodes" or "initialEdges" or coordinates.
                    - Keep the depth to 2-3 levels maximum.
                    - Keep labels concise (1-5 words).
                    `;
                    userPrompt = `Create a matching mind map structure for the following content.
                    - Use typical React Flow layout coordinates roughly centered around 0,0. Spacing is important (e.g. increments of 200px).
                    
                    Content:\n${documentContent}`;
                    break;
                case 'plan':
                    systemPrompt = `You are an expert study planner.
                    IMPORTANT: Output valid, strict JSON only. No markdown.
                    Output format: A JSON Object with the following structure:
                    {
                      "title": "Mastery Plan for [Topic]",
                      "weeks": [
                        {
                          "week": 1,
                          "title": "Foundation and Basics",
                          "days": [
                            { 
                              "day": 1, 
                              "topic": "Introduction to X", 
                              "activities": ["Read chapter 1", "Try exercise A"],
                              "duration": "1-2 hours"
                            }
                          ]
                        }
                      ]
                    }
                    - Plan for 1-4 weeks depending on content complexity.
                    - Each day should have 1-3 concise activities.
                    `;
                    userPrompt = `Create a structured study plan to master the material in the following content.
                    
                    Content:\n${documentContent}`;
                    break;
                case 'coding':
                    systemPrompt = `You are a technical interview coach.
                    IMPORTANT: Output valid, strict JSON ONLY. No markdown wrapper. No conversational preamble or post-text.
                    Output format: JSON Array of objects:
                    [
                      {
                        "title": "Clean Title",
                        "problem": "Detailed problem description. If you use quotes, escape them with \\\".",
                        "hint": "Subtle hint.",
                        "solution": "Full solution code. IMPORTANT: Use \\n for newlines and escape all double quotes with \\. Do NOT use actual backticks (\`) inside the JSON string as it can break some parsers, use standard code formatting or escape them.",
                        "difficulty": "Easy/Medium/Hard"
                      }
                    ]
                    - Generate 3-5 high-quality coding questions.
                    - Ensure the JSON is perfectly valid and parseable by standard JSON.parse().
                    - DO NOT include ANY markdown code blocks (like \`\`\`json).
                    `;
                    userPrompt = `Generate coding or logic questions based on the following content.\n\nContent:\n${documentContent}`;
                    break;
                default:
                    userPrompt = `Summarize and structure the following content for easy learning.\n\nContent:\n${documentContent}`;
            }
        }

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);

        let generatedText = response.content;
        let cleanText = typeof generatedText === 'string' ? generatedText : String(generatedText);

        // More aggressive cleanup for JSON-specific types
        if (['quiz', 'flashcards', 'mindmap', 'plan', 'coding'].includes(type as string)) {
            // Remove everything before the first [ or { and everything after the last ] or }
            const firstBracket = cleanText.indexOf('[');
            const firstBrace = cleanText.indexOf('{');
            const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;

            const lastBracket = cleanText.lastIndexOf(']');
            const lastBrace = cleanText.lastIndexOf('}');
            const end = Math.max(lastBracket, lastBrace);

            if (start !== -1 && end !== -1 && end > start) {
                cleanText = cleanText.substring(start, end + 1);
            }

            // Further strip any residual markdown wrappers that might have survived substring
            cleanText = cleanText.replace(/```(json|markdown)?\n?/g, '').replace(/```$/g, '');
        } else {
            // For general markdown content
            cleanText = cleanText.replace(/```(json|markdown)?\n?/g, '').replace(/```$/g, '');
        }

        res.json({ content: cleanText });

    } catch (error: any) {
        console.error("Error generating learning content:", error);
        res.status(500).json({ error: `Failed to generate content: ${error.message}` });
    }
}

export const analogySearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, orgId } = req.body;

        if (!query) {
            res.status(400).json({ error: "Search query is required" });
            return;
        }

        // Resolve orgId safely
        let safeOrgId: string | mongoose.Types.ObjectId = orgId;
        if (!orgId || orgId === "default-org" || !mongoose.Types.ObjectId.isValid(orgId)) {
            const Organization = mongoose.model('Organization');
            const userOrg = await Organization.findOne({ 'members.userId': (req as any).user?.id });
            if (userOrg) safeOrgId = userOrg._id as mongoose.Types.ObjectId;
        }

        if (!safeOrgId || safeOrgId === "default-org" || !mongoose.Types.ObjectId.isValid(safeOrgId as any)) {
            res.status(400).json({ error: "Organization ID is required and could not be determined" });
            return;
        }

        const analogyService = new AnalogySearchService();

        console.log(`[Analogy Search] Query: "${query}" for org: ${safeOrgId}`);
        const results = await analogyService.search(query, safeOrgId.toString());

        res.json(results);
    } catch (error: any) {
        console.error("Analogy search failed:", error);
        res.status(500).json({ error: `Search failed: ${error.message}` });
    }
};

export const detectContradictions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.body;

        // Resolve orgId safely
        let safeOrgId: string | mongoose.Types.ObjectId = orgId;
        if (!orgId || orgId === "default-org" || !mongoose.Types.ObjectId.isValid(orgId)) {
            const Organization = mongoose.model('Organization');
            const userOrg = await Organization.findOne({ 'members.userId': (req as any).user?.id });
            if (userOrg) safeOrgId = userOrg._id as mongoose.Types.ObjectId;
        }

        if (!safeOrgId || safeOrgId === "default-org" || !mongoose.Types.ObjectId.isValid(safeOrgId as any)) {
            res.status(400).json({ error: "Organization ID is required and could not be determined" });
            return;
        }

        const synthesisService = new WorkspaceSynthesisService();
        const results = await synthesisService.detectContradictions(safeOrgId.toString());
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const workspaceSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId, query } = req.body;

        // Resolve orgId safely
        let safeOrgId: string | mongoose.Types.ObjectId = orgId;
        if (!orgId || orgId === "default-org" || !mongoose.Types.ObjectId.isValid(orgId)) {
            const Organization = mongoose.model('Organization');
            const userOrg = await Organization.findOne({ 'members.userId': (req as any).user?.id });
            if (userOrg) safeOrgId = userOrg._id as mongoose.Types.ObjectId;
        }

        if (!safeOrgId || safeOrgId === "default-org" || !mongoose.Types.ObjectId.isValid(safeOrgId as any)) {
            res.status(400).json({ error: "Organization ID is required and could not be determined" });
            return;
        }

        const synthesisService = new WorkspaceSynthesisService();
        const result = await synthesisService.generateUnifiedSummary(safeOrgId.toString(), query);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const editContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, instruction, orgId } = req.body;

        if (!text || !instruction) {
            res.status(400).json({ error: "Text and instruction are required" });
            return;
        }

        if (!process.env.GOOGLE_API_KEY) {
            res.status(500).json({ error: "Server configuration error: Missing Google API Key" });
            return;
        }

        const chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 2048,
        });

        const systemPrompt = `You are an expert AI editor.
        Your task is to modify the provided text based STRICTLY on the user's instruction.
        
        Rules:
        - Output ONLY the modified text.
        - Do not add quotes, markdown wrappers, or conversational filler.
        - Preserve the original meaning unless asked to change it.
        `;

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Text: "${text}"\n\nInstruction: ${instruction}\n\nModified Text:`)
        ]);

        const modifiedText = typeof response.content === 'string' ? response.content : String(response.content);
        res.json({ content: modifiedText.trim() });

    } catch (error: any) {
        console.error("Error in editContent:", error);
        res.status(500).json({ error: `Failed to edit content: ${error.message}` });
    }
};

export const autocompleteContent = async (req: Request, res: Response): Promise<void> => {
    // Deprecated in favor of generateContent, keeping for backward compatibility if needed
    // or we can redirect logic.
    return generateContent(req, res);
};

export const generateContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { context, instruction, orgId } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            res.status(500).json({ error: "Server configuration error: Missing Google API Key" });
            return;
        }

        const chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 2048,
            streaming: true,
        });

        let promptMessages = [];

        if (instruction) {
            // "Ask AI" or specific command mode
            const systemPrompt = `You are an expert AI writing assistant.
             Task: ${instruction}
             
             Context from document:
             "${context || ''}"
             
             Rules:
             - Output ONLY the result.
             - Do not use markdown wrappers unless requested.
             `;
            promptMessages = [new SystemMessage(systemPrompt), new HumanMessage("Go.")];
        } else {
            // "Continue writing" mode
            const systemPrompt = `You are a helpful AI co-writer.
            Continue the text naturally from the provided context.
            
            Rules:
            - Maintain the tone and style.
            - Do not repeat the last sentence.
            - Keep it to 1-2 paragraphs max unless asked otherwise.
            `;
            promptMessages = [new SystemMessage(systemPrompt), new HumanMessage(`Context: "${context}"\n\nContinue:`)];
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = await chatModel.stream(promptMessages);

        for await (const chunk of stream) {
            if (chunk.content) {
                const text = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
                res.write(text);
            }
        }

        res.end();

    } catch (error: any) {
        console.error("Error in generateContent:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: `AI generation failed: ${error.message}` });
        } else {
            res.end();
        }
    }
};
