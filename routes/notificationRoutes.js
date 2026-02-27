import express from 'express';
import Notification from '../models/Notification.js';
import NotificationSetting from '../models/NotificationSettings.js';
import notificationService from '../services/NotificationService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'];
        if (!userId) return res.status(400).json({ message: 'User ID required' });
        const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { status: 'read', isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        console.error('❌ Error marking notification as read:', err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/settings', async (req, res) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'];
        if (!userId) return res.status(400).json({ message: 'User ID required' });
        let settings = await NotificationSetting.findOne({ user: userId });
        if (!settings) {
            settings = {
                user: userId,
                preferences: Object.keys(notificationService.EVENT_ROLE_MAP).map(type => ({
                    eventType: type,
                    inApp: true,
                    email: true
                }))
            };
        }
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/settings', async (req, res) => {
    try {
        const userId = req.body.userId || req.headers['x-user-id'];
        const settings = await NotificationSetting.findOneAndUpdate(
            { user: userId },
            { preferences: req.body.preferences },
            { upsert: true, new: true }
        );
        res.json(settings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;