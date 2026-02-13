//signup,login and me endpoints

import express from "express"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Organization from "../models/Organization"
import { protect, AuthRequest } from "../middleware/auth"
import User from "../models/User"
const router = express.Router();

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: "30d"
    })
}

//route POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        // Create default organization
        const orgName = `${fullName}'s Workspace`;
        const org = await Organization.create({
            name: orgName,
            slug: orgName.toLowerCase().replace(/\s+/g, '-'),
            ownerId: user._id,
            members: [{ userId: user._id, role: 'ADMIN' }]
        });

        const token = generateToken(user._id.toString());

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            orgId: org._id
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : error });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" })
        }
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = generateToken(user._id.toString());
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })
        const org = await Organization.findOne({ 'members.userId': user._id });
        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            orgId: org?._id
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
})

router.post('/logout', (req, res) => {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out' });
});
// @route GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
            if (lastActive) {
                const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

                const diffTime = today.getTime() - lastDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Successive day
                    user.streakCount += 1;
                    user.reviewsToday = 0; // Reset for new day
                    user.lastActiveDate = now;
                    await user.save();
                } else if (diffDays > 1) {
                    // Broken streak
                    user.streakCount = 1;
                    user.reviewsToday = 0; // Reset for new day
                    user.lastActiveDate = now;
                    await user.save();
                } else if (!user.lastActiveDate) {
                    // First time activity
                    user.streakCount = 1;
                    user.reviewsToday = 0;
                    user.lastActiveDate = now;
                    await user.save();
                }
            } else {
                user.streakCount = 1;
                user.lastActiveDate = now;
                await user.save();
            }
        }
        const org = await Organization.findOne({ 'members.userId': req.user.id });
        res.json({
            ...user?.toObject(),
            orgId: org?._id
        });
    } catch (error) {
        console.error("Streak update error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route POST /api/auth/activity
router.post('/activity', protect, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.reviewsToday = (user.reviewsToday || 0) + 1;
            await user.save();
            return res.json({ reviewsToday: user.reviewsToday });
        }
        res.status(404).json({ message: "User not found" });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route POST /api/auth/google
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
            // Update googleId if not present (linking accounts)
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                fullName: name || 'User',
                email,
                googleId,
                avatarUrl: picture,
                password: '', // No password for Google Auth users
            });

            // Create default organization
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
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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