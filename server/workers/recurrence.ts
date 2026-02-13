import nodeCron from 'node-cron';
import pkg from 'rrule';
const { RRule } = pkg;
import Document from '../models/Document';
import mongoose from 'mongoose';

const processRecurrence = async () => {
    console.log('[Recurrence] Checking for recurring documents...');

    // Find documents that have a recurrence rule and where nextRun is due
    const now = new Date();

    // Find docs that are due (nextRun <= now) AND are not archived
    const dueDocs = await Document.find({
        'recurrence.nextRun': { $lte: now },
        'recurrence.rule': { $exists: true, $ne: null },
        isArchived: { $ne: true }
    });

    console.log(`[Recurrence] Found ${dueDocs.length} documents due for cloning.`);

    for (const doc of dueDocs) {
        if (!doc.recurrence || !doc.recurrence.rule) continue;

        try {
            // 1. Calculate the *next* nextRun date
            const rule = RRule.fromString(doc.recurrence.rule);
            const nextDate = rule.after(now);

            // 2. Clone the document
            const newDoc = new Document({
                ...doc.toObject(),
                _id: new mongoose.Types.ObjectId(),
                title: `${doc.title} (New)`, // Optional: append date?
                createdAt: new Date(),
                updatedAt: new Date(),
                // Reset recurrence on the clone? Or keep it?
                // Usually the clone is the "instance" and shouldn't recurse itself.
                recurrence: undefined,
                parentDocument: doc.parentDocument, // Keep hierarchy
                isPublished: false, // Maybe reset this?
            });

            await newDoc.save();
            console.log(`[Recurrence] Created instance: ${newDoc._id} from template ${doc._id}`);

            // 3. Update the original document's nextRun
            doc.recurrence.lastRun = now;

            if (nextDate) {
                doc.recurrence.nextRun = nextDate;
            } else {
                console.log(`[Recurrence] Document ${doc._id} recurrence has finished.`);
                doc.recurrence = undefined; // Remove recurrence as it is finished
            }

            await doc.save();

        } catch (err) {
            console.error(`[Recurrence] Failed to process document ${doc._id}:`, err);
        }
    }
};

// Initialize the worker
export const initRecurrenceWorker = () => {
    // Run every hour (or every minute for testing)
    // 0 * * * * = every hour
    nodeCron.schedule('0 * * * *', processRecurrence);
    console.log('[Recurrence] Worker initialized. Schedule: Hourly.');

    // Run once on startup for dev purposes?
    if (process.env.NODE_ENV !== 'production') {
        // processRecurrence();
    }
}
