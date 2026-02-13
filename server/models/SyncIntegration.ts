import mongoose, { Schema, Document } from "mongoose";

export interface ISyncIntegration extends Document {
    userId: mongoose.Types.ObjectId;
    provider: 'GOOGLE_CALENDAR'; // Extendable to 'TODOIST', 'NOTION', etc.
    accessToken: string;
    refreshToken: string;
    expiryDate: number; // Timestamp
    syncToken?: string; // Google Calendar Sync Token for incremental updates
    resourceId?: string; // Webhook Resource ID
    channelId?: string; // Webhook Channel ID
    channelExpiration?: number; // Webhook Expiration
    createdAt: Date;
    updatedAt: Date;
}

const SyncIntegrationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['GOOGLE_CALENDAR'], required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiryDate: { type: Number, required: true },
    syncToken: { type: String },
    resourceId: { type: String },
    channelId: { type: String },
    channelExpiration: { type: Number }
}, { timestamps: true });

// Ensure one active integration per provider per user
SyncIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.model<ISyncIntegration>('SyncIntegration', SyncIntegrationSchema);
