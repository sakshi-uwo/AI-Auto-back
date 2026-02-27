import express from 'express';
import Billing from '../models/Billing.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

const router = express.Router();

// @route   GET /api/billing/:userId
// @desc    Get real-time billing and usage data
router.get('/:userId', async (req, res) => {
    try {
        let billing = await Billing.findOne({ userId: req.params.userId });

        // If no billing record exists, initialize one based on default/user role
        if (!billing) {
            billing = new Billing({
                userId: req.params.userId,
                plan: 'Pro', // Default for demo/prototyping
                usage: {
                    projects: { used: await Project.countDocuments({ assignedTo: req.params.userId }), limit: 10 },
                    users: { used: await User.countDocuments(), limit: 20 },
                    automationRuns: { used: 320, limit: 500 },
                    aiPredictions: { used: 90, limit: 200 },
                    storageGB: { used: 12, limit: 20 }
                }
            });
            await billing.save();
        }

        // Live refresh logic: count actual projects/users if needed
        const liveProjectCount = await Project.countDocuments();
        const liveUserCount = await User.countDocuments();

        billing.usage.projects.used = liveProjectCount;
        billing.usage.users.used = liveUserCount;

        res.json(billing);
    } catch (err) {
        console.error('❌ Billing fetch error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/billing/:userId
// @desc    Update billing settings (plan, auto-renew)
router.patch('/:userId', async (req, res) => {
    try {
        const { plan, autoRenew, usageUpdate } = req.body;
        const updateData = {};

        if (plan) updateData.plan = plan;
        if (autoRenew !== undefined) updateData.autoRenew = autoRenew;
        if (usageUpdate) {
            // Complex usage update logic
            Object.keys(usageUpdate).forEach(key => {
                if (updateData[`usage.${key}.used`]) {
                    updateData[`usage.${key}.used`] = usageUpdate[key];
                }
            });
        }

        const billing = await Billing.findOneAndUpdate(
            { userId: req.params.userId },
            { $set: updateData },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('billingUpdated', billing);
        }

        res.json(billing);
    } catch (err) {
        console.error('❌ Billing update error:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
