import express from 'express';
import Redirect from '../models/Redirect.js';

const router = express.Router();

// @route   GET /api/redirect/:source
// @desc    Redirect to Linktree and track the source
router.get('/:source', async (req, res) => {
    try {
        const { source } = req.params;
        const targetUrl = process.env.LINKTREE_URL || 'https://linktr.ee/yugamc';

        // Find and update or create new source entry
        const redirect = await Redirect.findOneAndUpdate(
            { source: source.toLowerCase() },
            {
                $inc: { count: 1 },
                $set: { lastClicked: new Date() }
            },
            { new: true, upsert: true }
        );

        // Emit real-time update via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('redirectUpdate', redirect);
            console.log(`📢 Real-time event emitted: redirectUpdate for source: ${source}`);
        }

        // Perform the redirect
        res.redirect(targetUrl);
    } catch (err) {
        console.error('❌ Redirect Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/redirect-stats
// @desc    Get all redirect stats
router.get('/stats/all', async (req, res) => {
    try {
        const stats = await Redirect.find().sort({ count: -1 });
        res.json(stats);
    } catch (err) {
        console.error('❌ Error fetching redirect stats:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
