import express from 'express';
import SystemSettings from '../models/SystemSettings.js';
import notificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get global system settings
router.get('/', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/settings
// @desc    Update global system settings
router.patch('/', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
        }

        const updates = req.body;
        const oldMaintenanceMode = settings.maintenanceMode;

        Object.keys(updates).forEach(key => {
            settings[key] = updates[key];
        });

        const newMaintenanceMode = settings.maintenanceMode;

        // Trigger notifications if maintenance mode changed
        if (oldMaintenanceMode !== newMaintenanceMode) {
            if (newMaintenanceMode) {
                // Maintenance Started
                notificationService.broadcastNotification({
                    title: "CRITICAL: System Maintenance Started",
                    message: settings.maintenanceNotice || "AI-AUTO is undergoing scheduled updates. Access is restricted to Admins only.",
                    priority: "high",
                    email: true
                });
            } else {
                // System Back Online
                notificationService.broadcastNotification({
                    title: "System Back Online",
                    message: "AI-AUTO maintenance has concluded. Normal operations have resumed.",
                    priority: "medium",
                    email: true
                });
            }
        }

        settings.updatedAt = Date.now();
        await settings.save();

        // Emit socket event for real-time update of settings across all clients
        const io = req.app.get('io');
        if (io) {
            io.emit('settingsUpdated', settings);
        }

        res.json(settings);
    } catch (err) {
        console.error('Error updating settings:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
