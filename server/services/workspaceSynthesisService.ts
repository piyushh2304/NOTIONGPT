import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import Document from "../models/Document";

export class WorkspaceSynthesisService {
    private model: ChatGoogleGenerativeAI;

    constructor() {
        this.model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 4096,
        });
    }

    /**
     * Finds contradictions across multiple documents
     */
    async detectContradictions(orgId: string) {
        const docs = await Document.find({ orgId, isArchived: { $ne: true } }).select('title content');

        if (docs.length < 2) return { contradictions: [], message: "Not enough documents to compare." };

        const docSummary = docs.map(d => `Title: ${d.title}\nContent: ${(d as any).content?.substring(0, 1000)}`).join("\n\n---\n\n");

        const prompt = `You are a Logic and Consistency Auditor. Your task is to analyze the following documents from a user's workspace and identify any factual contradictions, conflicting deadlines, or inconsistent statements.
        
        Documents:
        ${docSummary}
        
        Task:
        1. Identify specific contradictions (e.g., "Doc A says the meeting is at 2 PM, but Doc B says 3 PM").
        2. Provide a clarity suggestion for each.
        
        Output format: JSON Array
        [{ "docs": ["Title A", "Title B"], "contradiction": "Description", "severity": "High/Medium/Low", "suggestion": "Fix" }]
        `;

        const response = await this.model.invoke([
            new SystemMessage(prompt),
            new HumanMessage("Find contradictions in my workspace.")
        ]);

        try {
            const content = typeof response.content === 'string' ? response.content : String(response.content);
            const cleanContent = content.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(cleanContent);
        } catch (e) {
            return [];
        }
    }

    /**
     * Generates a unified summary/timeline from multiple documents
     */
    async generateUnifiedSummary(orgId: string, query?: string) {
        const docs = await Document.find({ orgId, isArchived: { $ne: true } }).select('title content');
        const docSummary = docs.map(d => `Title: ${d.title}\nContent: ${(d as any).content?.substring(0, 1000)}`).join("\n\n---\n\n");

        const prompt = `You are a Executive Synthesizer. Your goal is to create a unified, high-level summary or timeline based on all documents in this workspace.
        
        ${query ? `The user is specifically interested in: "${query}"` : "Provide a general overview of all active projects, knowledge areas, and upcoming milestones."}
        
        Documents:
        ${docSummary}
        
        Output format: Structured Markdown (Notion-style). Use H1, H2, and Bullet points. Include a "Timeline" section if relevant dates are found.
        `;

        const response = await this.model.invoke([
            new SystemMessage(prompt),
            new HumanMessage("Synthesize my workspace.")
        ]);

        return {
            content: typeof response.content === 'string' ? response.content : String(response.content)
        };
    }
}
