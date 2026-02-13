import { useState, useCallback } from "react";
import { toast } from "sonner";

interface GenerateOptions {
    context?: string;
    instruction?: string;
    onStream?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
}

export const useAI = () => {
    const [isLoading, setIsLoading] = useState(false);

    const generate = useCallback(async ({ context, instruction, onStream, onComplete }: GenerateOptions) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || ""; // Simple auth retrieval
            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ context, instruction })
            });

            if (!response.ok || !response.body) {
                throw new Error(response.statusText);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                if (onStream) onStream(chunk);
            }

            if (onComplete) onComplete(fullText);

        } catch (error) {
            console.error("AI Generation failed:", error);
            toast.error("Failed to generate text");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { generate, isLoading };
};
