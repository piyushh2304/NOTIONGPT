import express from 'express';
import mongoose from 'mongoose';
import Document from '../models/Document';
import { AuthRequest } from "../middleware/auth";
import { pineconeIndex } from '../lib/vector-store';
import { getEmbeddings } from '../lib/embeddings';
import { GraphAnalysisService } from '../services/graphAnalysisService';

const router = express.Router();

router.get('/data', async (req: AuthRequest | any, res) => {
    try {
        const orgId = req.query.orgId || "default-org";
        const filter: any = {};
        const safeOrgId = req.user?.orgId?.toString() || orgId.toString();

        if (!mongoose.Types.ObjectId.isValid(safeOrgId)) {
            return res.json({ nodes: [], links: [] });
        }

        const docs = await Document.find({ orgId: safeOrgId, isArchived: { $ne: true } }).select('title icon masteryLevel createdAt content');
        const nodes = docs.map(d => ({
            id: d._id.toString(),
            name: d.title,
            val: (d.masteryLevel || 1) * 2,
            icon: d.icon || "📄",
            mastery: d.masteryLevel || 0
        }));

        const recentDocs = [...docs]
            .filter(d => d.title && d.createdAt)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 30);

        const links: any[] = [];
        const CONCURRENCY_LIMIT = 3;
        for (let i = 0; i < recentDocs.length; i += CONCURRENCY_LIMIT) {
            const chunk = recentDocs.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(chunk.map(async (doc) => {
                try {
                    const queryText = `${doc.title}`;
                    const embedding = await getEmbeddings(queryText);

                    const searchResponse = await pineconeIndex.query({
                        vector: embedding,
                        topK: 5,
                        filter: { orgId: safeOrgId },
                        includeMetadata: true
                    });

                    searchResponse.matches?.forEach(match => {
                        const matchDocId = match.metadata?.docId as string;
                        if (matchDocId && matchDocId !== doc._id.toString() && match.score && match.score > 0.7) {
                            const exists = links.find(l =>
                                (l.source === doc._id.toString() && l.target === matchDocId) ||
                                (l.source === matchDocId && l.target === doc._id.toString())
                            );

                            if (!exists) {
                                links.push({
                                    source: doc._id.toString(),
                                    target: matchDocId,
                                    value: match.score
                                });
                            }
                        }
                    });
                } catch (err: any) {
                    console.error(`[Graph] Error matching for ${doc._id}:`, err.message);
                }
            }));
        }

        res.json({ nodes, links });
    } catch (err: any) {
        console.error("Graph data error:", err);
        res.status(500).json({ nodes: [], links: [], error: err.message });
    }
});

router.post('/suggest', async (req: AuthRequest | any, res) => {
    try {
        const { text, currentDocId } = req.body;
        if (!text || text.length < 20) {
            return res.json({ suggestions: [] });
        }

        const safeOrgId = req.user?.orgId?.toString();
        if (!safeOrgId || !mongoose.Types.ObjectId.isValid(safeOrgId)) {
            return res.status(400).json({ error: "Invalid orgId" });
        }

        const embedding = await getEmbeddings(text);
        const searchResponse = await pineconeIndex.query({
            vector: embedding,
            topK: 6, // Increased slightly to filter more accurately
            filter: { orgId: safeOrgId, isArchived: { $ne: true } },
            includeMetadata: true
        });

        const suggestions = searchResponse.matches
            .filter(match => {
                const matchDocId = match.metadata?.docId as string;
                return matchDocId && matchDocId !== currentDocId && match.score && match.score > 0.65;
            })
            .map(match => ({
                id: match.metadata?.docId,
                title: match.metadata?.title,
                score: match.score,
                text: (match.metadata?.text as string || "").substring(0, 150) + "..."
            }))
            .slice(0, 3);

        res.json({ suggestions });
    } catch (err: any) {
        console.error("Suggestion error:", err);
        res.status(500).json({ suggestions: [], error: err.message });
    }
});

router.get('/analyze-gaps', async (req: AuthRequest | any, res) => {
    try {
        const safeOrgId = req.user?.orgId?.toString() || req.query.orgId;
        if (!safeOrgId) return res.status(400).json({ error: "Missing orgId" });

        console.log(`[Graph Analysis] Starting gap detection for org: ${safeOrgId}`);
        const docs = await Document.find({ orgId: safeOrgId, isArchived: { $ne: true } }).select('title content');
        const nodes = docs.map(d => ({
            id: d._id.toString(),
            name: d.title,
            content: (d as any).content || ""
        }));

        const analysisService = new GraphAnalysisService();
        const links: any[] = [];
        const clusters = analysisService.findClusters(nodes, links);
        const gaps = await analysisService.detectGaps(clusters);

        res.json({ clustersCount: clusters.length, gaps });
    } catch (err: any) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;