import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

const ROLE_MAP = {
    'Admin': 'admin',
    'Builder': 'builder',
    'Civil Engineer': 'civil_engineer',
    'Site Manager': 'project_site',
    'Client': 'client'
};

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// @route   POST /api/auth/login
// @desc    Login user (DB lookup with role verification)
router.post('/login', async (req, res) => {
    try {
        const { email, password, role: requestedRole } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log(`🔑 Login attempt: ${email} for role: ${requestedRole}`);

        // 1. Check Database Users
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ Login failed: User ${email} not found`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 2. Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Fallback for hardcoded mock passwords if they haven't been hashed (development only)
            const MOCK_PASSWORDS = {
                'admin@ai-auto.com': 'admin123',
                'builder@ai-auto.com': 'builder123',
                'engineer@ai-auto.com': 'engineer123',
                'manager@ai-auto.com': 'manager123',
                'client@ai-auto.com': 'client123'
            };
            if (MOCK_PASSWORDS[email] !== password) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        }

        // 3. Verify Status
        if (user.status === 'Pending' && user.role !== 'Admin') {
            console.log(`❌ Login blocked: ${email} is pending approval`);
            return res.status(403).json({ error: 'Your account is pending admin approval.' });
        }
        if (user.status === 'Inactive') {
            console.log(`❌ Login blocked: ${email} is inactive`);
            return res.status(403).json({ error: 'Your account has been deactivated.' });
        }

        // 4. Verify Role Matching
        const mappedRole = ROLE_MAP[user.role] || user.role.toLowerCase();
        if (requestedRole && requestedRole !== mappedRole) {
            return res.status(403).json({ error: `Access denied. Role mismatch.` });
        }

        // 5. Generate Tokens
        const accessToken = generateAccessToken(user._id);
        console.log('🔄 Login: Generating Refresh Token...');
        const refreshToken = generateRefreshToken(user._id);

        console.log('🔄 Login: Updating user in DB...');
        user.refreshTokens.push(refreshToken);
        await user.save();
        console.log('✅ Login: User saved.');

        console.log('🔄 Login: Setting cookie...');
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 6. Audit Login Notification (Builder Only)
        if (mappedRole === 'builder') {
            console.log('🔄 Login: Dispatching builder notification...');
            await NotificationService.createBuilderNotification({
                recipientId: user._id,
                type: 'USER_ACTION',
                title: 'Login Successful',
                message: `Builder ${user.name} logged into the dashboard.`,
                severity: 'low',
                showPopup: false // requirement: Do not show a popup to the Builder
            });
            console.log('✅ Login: Notification dispatched.');
        }

        console.log('✅ Login: Sending JSON response...');
        return res.json({
            token: accessToken,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                role: mappedRole,
                status: user.status
            }
        });

    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Get new access token
router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        console.warn('⚠️  Auth: Refresh attempt without cookie');
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user._id);
        res.json({ token: newAccessToken });
    } catch (err) {
        res.status(403).json({ error: 'Token expired or invalid' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
        const user = await User.findOne({ refreshTokens: refreshToken });
        if (user) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
            await user.save();
        }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});

export default router;
