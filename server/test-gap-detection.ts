
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { GraphAnalysisService } from './services/graphAnalysisService.js';

async function testGapDetection() {
    const service = new GraphAnalysisService();

    const mockClusters = [
        {
            id: 0,
            nodes: [
                { id: '1', name: 'React Context API', content: 'Discussion about how to use React Context for state management.' },
                { id: '2', name: 'Redux Toolkit', content: 'Modern Redux usage with createSlice and configureStore.' }
            ]
        },
        {
            id: 1,
            nodes: [
                { id: '3', name: 'Node.js Cluster Module', content: 'How to scale Node.js applications using the cluster module.' },
                { id: '4', name: 'Dockerizing Express Apps', content: 'Step by step guide to dockerize a MERN stack application.' }
            ]
        }
    ];

    console.log("Testing Detect Gaps with mock data...");
    try {
        const gaps = await service.detectGaps(mockClusters as any);
        console.log("Detected Gaps:", JSON.stringify(gaps, null, 2));
        if (Array.isArray(gaps)) {
            console.log("SUCCESS: Gaps returned as an array.");
        } else {
            console.log("FAILURE: Gaps is not an array.");
        }
    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

testGapDetection();
