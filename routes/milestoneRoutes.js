import express from 'express';
import Milestone from '../models/Milestone.js';
import { protect } from '../middleware/authMiddleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   GET /api/milestones
router.get('/', async (req, res) => {
    try {
        const milestones = await Milestone.find().sort({ date: 1 });
        res.json(milestones);
    } catch (err) {
        console.error('❌ Error fetching milestones:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/milestones/project/:projectId
router.get('/project/:projectId', async (req, res) => {
    try {
        const milestones = await Milestone.find({ projectId: req.params.projectId }).sort({ date: 1 });
        res.json(milestones);
    } catch (err) {
        console.error('❌ Error fetching milestones:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/milestones
router.post('/', protect, async (req, res) => {
    try {
        const newMilestone = new Milestone(req.body);
        const saved = await newMilestone.save();

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'PROJECT_STATUS_UPDATE',
                title: 'Milestone Updated',
                message: `Project milestone "${saved.title}" has been updated/added.`,
                severity: 'medium',
                projectId: saved.projectId,
                referenceId: saved._id,
                showPopup: true
            });
        }

        const io = req.app.get('io');
        if (io) io.emit('milestoneUpdated', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving milestone:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
