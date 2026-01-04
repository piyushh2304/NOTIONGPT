
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("No GOOGLE_API_KEY found in .env");
    process.exit(1);
}

async function listModels() {
    console.log("Checking models with key ending in...", apiKey?.slice(-4));
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models found?", data);
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

listModels();
