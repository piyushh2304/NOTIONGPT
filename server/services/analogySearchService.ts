import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { pineconeIndex } from "../lib/vector-store";
import { getEmbeddings } from "../lib/embeddings";

export class AnalogySearchService {
    private model: ChatGoogleGenerativeAI;

    constructor() {
        this.model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash",
            maxOutputTokens: 1024,
        });
    }

    /**
     * Performs a semantic analogy search
     * 1. Extracts abstract concepts from metaphorical query
     * 2. Generates semantic search terms
     * 3. Retrieves documents from Pinecone
     * 4. AI explains the link between result and analogy
     */
    async search(query: string, orgId: string) {
        // Step 1: Concept Extraction & Query Rewriting
        const rewritingPrompt = `You are a Semantic Search Specialist. The user is searching using a metaphor or analogy.
        User Query: "${query}"
        
        Task: 
        1. Identify the abstract concept/pattern the user is looking for (e.g., "Dependency Injection" for "A plug-and-play component").
        2. Generate 3-5 keywords or technical terms that represent this concept for a vector search.
        
        Output format: JSON
        { "concept": "Primary abstract concept", "searchTerms": ["term1", "term2", "term3"] }`;

        const rewriteResponse = await this.model.invoke([
            new SystemMessage(rewritingPrompt),
            new HumanMessage("Rewrite this search query into technical concepts.")
        ]);

        let rewriteData;
        try {
            const content = typeof rewriteResponse.content === 'string' ? rewriteResponse.content : String(rewriteResponse.content);
            const cleanContent = content.replace(/```json\n?|```/g, '').trim();
            rewriteData = JSON.parse(cleanContent);
        } catch (e) {
            rewriteData = { concept: query, searchTerms: [query] };
        }

        // Step 2: Vector Search
        const combinedSearch = [rewriteData.concept, ...rewriteData.searchTerms].join(" ");
        const embedding = await getEmbeddings(combinedSearch);

        const searchResponse = await pineconeIndex.query({
            vector: embedding,
            topK: 5,
            filter: { orgId: orgId },
            includeMetadata: true
        });

        // Step 3: Result Synthesis & Reasoning
        const results = await Promise.all(searchResponse.matches.map(async (match) => {
            const docTitle = match.metadata?.title as string || "Untitled";
            const docText = (match.metadata?.text as string || "").substring(0, 500);

            const reasoningPrompt = `A user searched for documents using an analogy: "${query}".
            We found this document: "${docTitle}".
            
            Briefly explain (in 1-2 sentences) why this document matches the analogy "${query}" based on its content.
            
            Document Content Snippet:
            "${docText}"`;

            const reasoningResponse = await this.model.invoke([
                new SystemMessage(reasoningPrompt),
                new HumanMessage("Explain the link.")
            ]);

            return {
                id: match.metadata?.docId,
                title: docTitle,
                score: match.score,
                reasoning: typeof reasoningResponse.content === 'string' ? reasoningResponse.content : String(reasoningResponse.content)
            };
        }));

        return {
            originalQuery: query,
            extractedConcept: rewriteData.concept,
            results: results
        };
    }
}
