import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers"; // Causing ERR_MODULE
import { pipeline } from "@xenova/transformers";

class LocalEmbeddings {
    private pipe: any;
    private modelName: string;

    constructor(modelName: string = "Xenova/all-MiniLM-L6-v2") {
        this.modelName = modelName;
    }

    async init() {
        if (!this.pipe) {
            this.pipe = await pipeline("feature-extraction", this.modelName);
        }
    }

    async embedQuery(text: string): Promise<number[]> {
        await this.init();
        const output = await this.pipe(text, { pooling: "mean", normalize: true });
        return Array.from(output.data);
    }
}

// Singleton instance to keep model loaded
const localEmbeddings = new LocalEmbeddings("Xenova/all-MiniLM-L6-v2");

export async function getEmbeddings(text: string) {
    try {
        return await localEmbeddings.embedQuery(text);
    } catch (error) {
        console.log("Error generating local embeddings", error);
        throw error;
    }
}

// Function to split text into smaller chunks
export async function splitTextIntoChunks(text: string) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    return await splitter.createDocuments([text]);
}
