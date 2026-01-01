
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    fullName: string;
    avatarUrl?: string;
    googleId?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional if using OAuth later
    fullName: { type: String, required: true },
    avatarUrl: { type: String },
    googleId: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
