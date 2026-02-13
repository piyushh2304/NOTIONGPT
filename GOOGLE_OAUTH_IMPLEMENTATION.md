# Google OAuth Implementation Guide

This guide outlines the complete implementation for Google OAuth in your PERN stack application (Postgres, Express, React, Node).

## 1. Dependencies

### Backend
Ensure these are installed in `server/package.json` (or root if monorepo):
```bash
npm install google-auth-library
```

### Frontend
Ensure these are installed in `package.json`:
```bash
npm install @react-oauth/google
```

## 2. Environment Variables

### Backend (`server/.env`)
Add your Google Client ID (from Google Cloud Console):
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Frontend (`.env` or hardcoded)
You need the *same* Client ID in the frontend.

## 3. Database Schema (`server/models/User.ts`)

Update your User model to store `googleId`.

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string; // Optional for OAuth users
    fullName: string;
    avatarUrl?: string;
    googleId?: string; // Field for Google OAuth
    // ... other fields
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    fullName: { type: String, required: true },
    avatarUrl: { type: String },
    googleId: { type: String }, // Add this
    // ... other fields
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
```

## 4. Backend Route (`server/routes/auth.ts`)

Implement the token verification route.

```typescript
import express from "express";
import { OAuth2Client } from 'google-auth-library';
import User from "../models/User";
import Organization from "../models/Organization";
import jwt from 'jsonwebtoken';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
};

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(400).json({ message: 'Invalid Google Token' });
        }

        const { email, name, sub: googleId, picture } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not found in Google Token' });
        }

        let user = await User.findOne({ email });

        if (user) {
            // Link account if not linked
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // New User Registration
            user = await User.create({
                fullName: name || 'User',
                email,
                googleId,
                avatarUrl: picture,
                password: '', // No password
            });

            // Create default organization for new user
            const orgName = `${user.fullName}'s Workspace`;
            await Organization.create({
                name: orgName,
                slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                ownerId: user._id,
                members: [{ userId: user._id, role: 'ADMIN' }]
            });
        }

        const authToken = generateToken(user._id.toString());

        res.cookie('token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        const org = await Organization.findOne({ 'members.userId': user._id });

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            orgId: org?._id
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: 'Google Auth Failed', error });
    }
});

export default router;
```

## 5. Frontend Provider (`src/App.tsx`)

Wrap your app with `GoogleOAuthProvider`.

```tsx
import { GoogleOAuthProvider } from "@react-oauth/google";
// ... imports

function App() {
  return (
    <AuthProvider>
        {/* Replace clientId with your actual Client ID */}
        <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID"> 
            <Router>
                <Routes>
                    {/* ... routes */}
                </Routes>
                <Toaster position="bottom-center" />
            </Router>
        </GoogleOAuthProvider>
    </AuthProvider>
  );
}

export default App;
```

## 6. Login Page (`src/pages/auth/login.tsx`)

Add the Google Login button and handler.

```tsx
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

// ... inside your component

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            // setLoading(true); // if you have loading state
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message || "Google Login failed");
            
            login(data);
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            // setLoading(false);
        }
    };

    return (
        <div>
            {/* ... other code */}
            
            <div className="flex justify-center mt-4">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        toast.error("Google Login Failed");
                    }}
                    theme="filled_black"
                    shape="circle"
                />
            </div>
        </div>
    );
```
