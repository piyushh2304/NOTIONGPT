import { Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";

export const performResearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, orgId } = req.body;

        if (!query) {
            res.status(400).json({ error: "Research query is required" });
            return;
        }

        if (!process.env.GOOGLE_API_KEY || !process.env.TAVILY_API_KEY) {
            res.status(500).json({ error: "Server configuration error: Missing API Keys (Google or Tavily)" });
            return;
        }

        console.log(`Starting autonomous research for: "${query}"`);

        // 1. Trigger Web Search via Tavily
        const searchTool = new TavilySearch({
            maxResults: 5,
        });

        let searchResultsText = "";
        try {
            const webResults = await searchTool.invoke(query);
            const results = typeof webResults === 'string' ? JSON.parse(webResults) : webResults;

            if (Array.isArray(results)) {
                searchResultsText = results.map((r: any) =>
                    `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`
                ).join("\n\n---\n\n");
            } else {
                searchResultsText = String(webResults);
            }
            console.log("Web research completed.");
        } catch (searchError) {
            console.error("Tavily search failed:", searchError);
            searchResultsText = "No web results found due to a search error.";
        }

        // 2. Synthesize findings into a structured document
        const chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 4096,
        });

        const systemPrompt = `You are an Autonomous Research Agent. 
        Your task is to take search results and transform them into a comprehensive, high-quality document.
        
        Guidelines:
        - Use professional, Notion-like formatting (Markdown).
        - Use H1 for the title, H2 and H3 for sections.
        - Include bullet points, bold text for emphasis, and tables if appropriate.
        - Synthesize information from multiple sources; do not just copy-paste.
        - Add a "References" section at the end with the URLs provided.
        - If the query is technical, include code examples if relevant.
        - Tone should be informative and objective.

        Output ONLY the markdown content. No conversational preamble.`;

        const userPrompt = `Query: ${query}

        Search Results:
        ${searchResultsText}

        Please generate a deep-dive research document based on these findings.`;

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);

        const generatedContent = typeof response.content === 'string' ? response.content : String(response.content);

        res.json({
            content: generatedContent,
            sources: searchResultsText.length > 0 ? "Web" : "None"
        });

    } catch (error: any) {
        console.error("Research Agent error:", error);
        res.status(500).json({ error: `Research failed: ${error.message}` });
    }
};
