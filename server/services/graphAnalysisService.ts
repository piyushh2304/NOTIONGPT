import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

interface Node {
    id: string;
    name: string;
    content: string;
}

interface Link {
    source: string;
    target: string;
}

interface Cluster {
    id: number;
    nodes: Node[];
}

export class GraphAnalysisService {
    private model: ChatGoogleGenerativeAI;

    constructor() {
        this.model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-1.5-flash",
            maxOutputTokens: 2048,
        });
    }

    /**
     * Finds connected components (clusters) in the graph
     */
    findClusters(nodes: Node[], links: Link[]): Cluster[] {
        const adjacencyList: Record<string, string[]> = {};
        nodes.forEach(node => adjacencyList[node.id] = []);
        links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
            if (adjacencyList[sourceId]) adjacencyList[sourceId].push(targetId);
            if (adjacencyList[targetId]) adjacencyList[targetId].push(sourceId);
        });

        const visited = new Set<string>();
        const clusters: Cluster[] = [];
        let clusterId = 0;

        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                const clusterNodes: Node[] = [];
                const queue = [node.id];
                visited.add(node.id);

                while (queue.length > 0) {
                    const currentId = queue.shift()!;
                    const currentNode = nodes.find(n => n.id === currentId);
                    if (currentNode) clusterNodes.push(currentNode);

                    (adjacencyList[currentId] || []).forEach(neighborId => {
                        if (!visited.has(neighborId)) {
                            visited.add(neighborId);
                            queue.push(neighborId);
                        }
                    });
                }

                clusters.push({ id: clusterId++, nodes: clusterNodes });
            }
        });

        return clusters;
    }

    /**
     * Detects "Knowledge Gaps" between clusters using LLM reasoning
     */
    async detectGaps(clusters: Cluster[]): Promise<any[]> {
        if (clusters.length < 2) return [];

        // Summarize clusters for the LLM
        const clusterSummaries = clusters.map(c => ({
            id: c.id,
            topics: c.nodes.slice(0, 5).map(n => n.name).join(", "),
            description: `Cluster of documents covering ${c.nodes[0]?.name} and related topics.`
        }));

        const systemPrompt = `You are a Knowledge Architect. Your job is to analyze separate clusters of a user's knowledge base and identify missed connections (Knowledge Gaps).
        
        Clusters:
        ${JSON.stringify(clusterSummaries, null, 2)}

        Task:
        1. Find 2 clusters that are currently disconnected but would benefit from a "Bridge Note" (a topic that links both).
        2. Propose a specific title and a brief reason for this bridge.
        
        Output format: STRICT JSON Array of objects. No dialogue. No markdown wrappers.
        [{ "clusterA": id, "clusterB": id, "bridgeTitle": "Suggested Note Title", "reason": "Why these should connect" }]
        
        Only suggest high-value connections. Return an empty array if no clear connections exist.`;

        try {
            const response = await this.model.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage("Analyze my knowledge graph for gaps and return ONLY the JSON array.")
            ]);

            let content = typeof response.content === 'string' ? response.content : String(response.content);

            // Aggressive JSON Extraction (similar to aiController.ts)
            let cleanText = content;
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            }

            // Strip any residual markdown markers
            cleanText = cleanText.replace(/```(json|markdown)?\n?/g, '').replace(/```$/g, '').trim();

            if (!cleanText || cleanText === "" || cleanText === "[]") {
                return [];
            }

            try {
                const parsed = JSON.parse(cleanText);
                return Array.isArray(parsed) ? parsed : [];
            } catch (jsonError) {
                console.error("[Gap Analysis] JSON Parse Error. Content:", cleanText);
                // Fallback attempt: if it's a "unterminated string" it might be truncated or have weird characters
                // For now, return empty to avoid crash
                return [];
            }
        } catch (error) {
            console.error("Gap detection failed:", error);
            return [];
        }
    }
}
