import { Request, Response } from 'express';
import { pineconeIndex } from '../lib/vector-store';
import { getEmbeddings } from '../lib/embeddings';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import Chat from '../models/Chat';

export const chatWithDocs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, orgId, chatId } = req.body;

        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        // Ensure orgId is a string
        const safeOrgId = String(orgId || "default-org");

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


        // Relaxed Filter: Only filter if we have a valid specific orgId, otherwise search everything
        const filter = (safeOrgId && safeOrgId !== "default-org") ? { orgId: safeOrgId } : undefined;

        const pineconePromise = pineconeIndex.query({
            vector: queryEmbedding,
            topK: 5,
            filter: filter,
            includeMetadata: true
        });

        // Trigger Web Search
        const searchTool = new TavilySearch({
            maxResults: 3,
        });
        const webSearchPromise = searchTool.invoke(message);

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

        // Process Web Results
        if (webResult.status === 'fulfilled') {
            try {
                const webResults = webResult.value;
                // Tavily returns a JSON string or object, need to handle both safely
                const results = typeof webResults === 'string' ? JSON.parse(webResults) : webResults;
                if (Array.isArray(results)) {
                    searchResultsText = results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");
                } else {
                    searchResultsText = String(webResults);
                }
                console.log("Web search completed.");
            } catch (err) {
                console.error("Error parsing web search results:", err);
            }
        } else {
            console.error("Web search failed:", webResult.reason);
        }

        // 3. Handle Chat Persistence
        console.log("Step 3: Persisting chat...");
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

        // 4. Call LLM (Gemini) with Streaming
        console.log("Step 4: Calling Gemini (Streaming)...");

        try {
            const chatModel = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                model: "gemini-2.5-flash",
                maxOutputTokens: 2048,
            });

            const systemPrompt = `You are an intelligent assistant. 
            Answer the user's question using the provided context.
            
            The context includes:
            1.  **Document Data**: Content from the user's private documents.
            2.  **Web Search Findings**: Real-time information from the internet.

            Synthesize this information to provide a comprehensive answer. 
            - If the answer is in the documents, prioritize that.
            - Use web search to supplement or explain concepts found in the documents.
            - If you use information from the web, mention it.

            **Document Data:**
            ${contextText || "No relevant documents found."}

            **Web Search Findings:**
            ${searchResultsText || "No web search results found."}
            `;

            const recentHistory = chat.messages.slice(-6, -1).map((m: any) =>
                m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
            );

            // Set headers for streaming
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

            // Save the full response to DB after streaming is complete
            try {
                chat.messages.push({ role: 'assistant', content: fullAiResponse });
                await chat.save();
                console.log("Chat saved successfully.");
            } catch (saveError) {
                console.error("Failed to save chat after streaming:", saveError);
            }

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
                    userPrompt = `Create a 30-day study plan to master the material in the following content.
                    - Break it down into weeks and days.
                    - Assign specific topics or review activities for each day.
                    - If the content is short, create a plan appropriate for the scope (e.g., 1-week plan).
                    
                    Content:\n${documentContent}`;
                    break;
                case 'coding':
                    userPrompt = `Generate 5 coding interview questions (with solutions) related to the technical topics in the following content.
                    - If no technical topics are found, state that and generate general comprehension questions.
                    - Provide the question, a hint, and then the solution code block.
                    
                    Content:\n${documentContent}`;
                    break;
                default:
                    userPrompt = `Summarize and structure the following content for easy learning.\n\nContent:\n${documentContent}`;
            }
        }

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);

        const generatedText = response.content;

        // Simple cleanup to ensure it doesn't wrap in markdown code blocks if the model adds them unnecessarily
        let cleanText = typeof generatedText === 'string' ? generatedText : String(generatedText);
        cleanText = cleanText.replace(/```(json|markdown)?\n?/g, '').replace(/```$/g, '');

        res.json({ content: cleanText });

    } catch (error: any) {
        console.error("Error generating learning content:", error);
        res.status(500).json({ error: `Failed to generate content: ${error.message}` });
    }
}
