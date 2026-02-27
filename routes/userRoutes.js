import express from 'express';
import User from '../models/User.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

import bcrypt from 'bcryptjs';

// @route   POST /api/signup
// @desc    Create a new user (signup)
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Client',
            status: 'Active' // Set to Active by default for development/demo ease
        });

        const savedUser = await newUser.save();
        console.log(`✅ New user signed up: ${savedUser.name} as ${savedUser.role} (Status: ${savedUser.status})`);

        // Trigger Notification
        await NotificationService.triggerNotification('user_created', {
            title: '🎉 New User Signup',
            message: `New account created: ${savedUser.name} (${savedUser.email}) as ${savedUser.role}.`,
            priority: 'medium',
            metadata: { userId: savedUser._id }
        });

        // Don't send password back
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (err) {
        console.error('❌ Error during signup:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users
// @desc    Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error('❌ Error fetching users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/users
// @desc    Create a new user and emit socket event
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Client',
            status: status || 'Active'
        });

        const savedUser = await newUser.save();

        // Trigger Notification
        await NotificationService.triggerNotification('user_created', {
            title: '🎉 User Created',
            message: `New user added: ${savedUser.name} (${savedUser.email}) as ${savedUser.role}.`,
            priority: 'medium',
            metadata: { userId: savedUser._id }
        });

        // Emit socket event (for backward compatibility if any)
        const io = req.app.get('io');
        if (io) {
            io.emit('newUser', savedUser);
            console.log('📢 Real-time event emitted: newUser', savedUser._id);
        }

        // Send Welcome Email
        try {
            const emailService = (await import('../utils/emailService.js')).default;
            await emailService.sendEmail(
                savedUser.email,
                '🎉 Welcome to AI_AUTO!',
                `Hello ${savedUser.name},\n\nYour account has been created successfully.\n\nLogin Email: ${savedUser.email}\nPassword: ${password}\n\nYou can log in at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n\nBest regards,\nThe AI_AUTO Team`,
                `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0047AB;">Welcome to AI_AUTO, ${savedUser.name}!</h2>
                    <p>Your account has been successfully created by an administrator.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Login Email:</strong> ${savedUser.email}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                    </div>
                    <p>You can access your dashboard here:</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 12px 24px; background: #0047AB; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8rem; color: #666;">If you have any questions, please contact your project manager or support.</p>
                </div>`
            );
            console.log(`📧 Welcome email sent to: ${savedUser.email}`);
        } catch (emailErr) {
            console.error(`[WARN] Failed to send welcome email to ${savedUser.email}:`, emailErr.message);
        }

        res.status(201).json(savedUser);
    } catch (err) {
        console.error('❌ Error saving user:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email address already in use.' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// @route   PATCH /api/users/:id
// @desc    Update a user
router.patch('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('❌ Error updating user:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
