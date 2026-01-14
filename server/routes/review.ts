import express from 'express';
import Document from '../models/Document';
import { AuthRequest } from "../middleware/auth";
import { addDays } from 'date-fns';

const router = express.Router();

/**
 * @desc    Record a review for a document (SRS update)
 * @route   POST /api/documents/:id/review
 * @access  Private
 */
router.post('/:id', async (req: AuthRequest | any, res) => {
    try {
        const { score } = req.body; // score is 0-5
        const docId = req.params.id;

        const doc = await Document.findById(docId);
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Verify ownership (simplified, in production use middleware)
        if (doc.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const now = new Date();
        const currentMastery = doc.masteryLevel || 0;

        // SM-2 Simplified Algorithm
        // masteryLevel corresponds to "n" (number of successful repetitions)
        // We'll use the score to determine the next interval

        let nextInterval = 1; // Default 1 day
        let newMastery = currentMastery;

        if (score >= 3) {
            // Success
            if (currentMastery === 0) nextInterval = 1;
            else if (currentMastery === 1) nextInterval = 4;
            else nextInterval = Math.round(currentMastery * 2.5 * (currentMastery + 1));

            newMastery = Math.min(5, currentMastery + 1);
        } else {
            // Failure
            nextInterval = 1;
            newMastery = Math.max(0, currentMastery - 1);
        }

        // Clamp interval to reasonable bounds (max 365 days)
        nextInterval = Math.min(365, Math.max(1, nextInterval));

        const nextReviewAt = addDays(now, nextInterval);

        // Update document
        const updatedDoc = await Document.findByIdAndUpdate(
            docId,
            {
                $set: {
                    lastReviewedAt: now,
                    nextReviewAt: nextReviewAt,
                    masteryLevel: newMastery
                }
            },
            { new: true }
        );

        res.json({
            message: "Review recorded",
            nextReviewAt: updatedDoc?.nextReviewAt,
            masteryLevel: updatedDoc?.masteryLevel
        });

    } catch (error) {
        console.error("Review Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
