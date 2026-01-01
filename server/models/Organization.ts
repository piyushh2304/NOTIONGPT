import mongoose, { Schema, Document } from 'mongoose';
export interface IOrganization extends Document {
    name: string;
    slug: string;
    ownerId: mongoose.Types.ObjectId;
    members: Array<{
        userId: mongoose.Types.ObjectId;
        role: 'ADMIN' | 'MEMBER' | 'GUEST';
    }>;
}
const OrganizationSchema: Schema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['ADMIN', 'MEMBER', 'GUEST'], default: 'MEMBER' }
    }]
}, { timestamps: true });
export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
