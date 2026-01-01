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
        res.status(500).json({ message: 'Server error', error });
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
        const org = await Organization.findOne({ 'members.userId': req.user.id });
        res.json({
            ...user?.toObject(),
            orgId: org?._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
export default router;