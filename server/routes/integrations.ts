import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { protect, AuthRequest } from '../middleware/auth';
import SyncIntegration from '../models/SyncIntegration';

const router = express.Router();

// Configuration for Offline Access (RefreshToken)
const googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Need to ensure user adds this to .env
    redirect: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback' // Needs to exactly match Google Console
};

const createConnection = () => {
    return new OAuth2Client(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirect
    );
}

const defaultScope = [
    'https://www.googleapis.com/auth/calendar.events', // Read/Write events
    'https://www.googleapis.com/auth/calendar.readonly' // Read calendars
];

// @route GET /api/integrations/google/auth-url
// @desc Get the URL to redirect user to Google for consent
router.get('/google/auth-url', protect, (req: AuthRequest, res) => {
    const auth = createConnection();
    const url = auth.generateAuthUrl({
        access_type: 'offline', // Crucial for Refresh Token
        prompt: 'consent', // Force consent to get refresh token every time (for dev)
        scope: defaultScope,
        state: req.user.id.toString() // Pass user ID in state to recover it in callback (though callback is usually public, we can use cookies or this)
    });
    res.json({ url });
});

// @route GET /api/integrations/google/callback
// @desc Handle Google OAuth Callback
router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const auth = createConnection();
        const { tokens } = await auth.getToken(code as string);

        if (!tokens.access_token) {
            return res.status(400).send('Failed to retrieve tokens');
        }

        // 'state' parameter contains userId
        const userId = state as string;

        // Upsert the integration record
        await SyncIntegration.findOneAndUpdate(
            { userId, provider: 'GOOGLE_CALENDAR' },
            {
                userId,
                provider: 'GOOGLE_CALENDAR',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token, // May be undefined if not first time/prompt=consent
                expiryDate: tokens.expiry_date
            },
            { upsert: true, new: true }
        );

        // Redirect back to frontend
        // In dev: localhost:5173/dashboard?integration=success
        // In prod: app.com/dashboard...
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/dashboard?integration=success`);

    } catch (error) {
        console.error('Google Integration callback error:', error);
        res.status(500).send('Authentication Failed');
    }
});

// @route GET /api/integrations/status
// @desc Check if user has active integrations
router.get('/status', protect, async (req: AuthRequest, res) => {
    try {
        const integrations = await SyncIntegration.find({ userId: req.user.id });
        res.json(integrations.map(i => ({
            provider: i.provider,
            active: !!i.accessToken,
            lastSynced: i.updatedAt
        })));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
