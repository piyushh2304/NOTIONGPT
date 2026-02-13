
interface AIEditOptions {
    text: string;
    instruction: string;
}

interface AIAutocompleteOptions {
    context: string;
}

export const AIEditorService = {
    /**
     * Modify text based on instructions (e.g. "Fix grammar", "Make shorter")
     */
    editContent: async ({ text, instruction }: AIEditOptions): Promise<string> => {
        try {
            const response = await fetch('/api/ai/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, instruction }),
            });

            if (!response.ok) {
                throw new Error('AI Edit failed');
            }

            const data = await response.json();
            return data.content || text;
        } catch (error) {
            console.error('AI Edit Error:', error);
            throw error;
        }
    },

    /**
     * Autocomplete based on context
     */
    autocomplete: async ({ context }: AIAutocompleteOptions): Promise<string> => {
        try {
            const response = await fetch('/api/ai/autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context }),
            });

            if (!response.ok) {
                throw new Error('AI Autocomplete failed');
            }

            const data = await response.json();
            return data.content || '';
        } catch (error) {
            console.error('AI Autocomplete Error:', error);
            throw error;
        }
    },

    /**
     * Generate content with streaming
     */
    streamGenerate: async ({ context, instruction, onStream, onComplete }: {
        context?: string;
        instruction?: string;
        onStream: (chunk: string) => void;
        onComplete?: (fullText: string) => void;
    }): Promise<void> => {
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context, instruction }),
            });

            if (!response.ok || !response.body) {
                throw new Error('AI Generation failed');
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
            console.error('AI Stream Error:', error);
            throw error;
        }
    }
};
