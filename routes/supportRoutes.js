import express from 'express';
import Support from '../models/Support.js';

const router = express.Router();

// @route   GET /api/support/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const tickets = await Support.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(tickets);
    } catch (err) {
        console.error('❌ Error fetching support tickets:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/support
// @desc    Submit a support ticket
router.post('/', async (req, res) => {
    try {
        const {
            email, name, issueType, message, userId, priority, relatedTo,
            projectName, category, title, location, attachments,
            standardsReference, requestedAction, assignTo,
            expectedTimeline, impactIfDelayed, status: requestedStatus
        } = req.body;

        // Generate Request ID: REQ-YYYYMMDD-RANDOM
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const requestId = `REQ-${dateStr}-${randomStr}`;

        const status = requestedStatus || 'Submitted';

        const newTicket = new Support({
            email,
            name,
            requestId,
            issueType,
            message,
            userId: userId || null,
            priority: priority || 'Normal',
            relatedTo,
            projectName,
            category,
            title,
            location,
            attachments,
            standardsReference,
            requestedAction,
            assignTo,
            expectedTimeline,
            impactIfDelayed,
            status,
            approvalHistory: [{
                status: status,
                actor: 'System',
                note: status === 'Draft' ? 'Request saved as draft' : 'Request submitted for review',
                date: new Date()
            }]
        });

        const saved = await newTicket.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('supportUpdated', saved);
            // Targeted notifications could be added here
        }

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error handling support ticket:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
