import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   POST /api/ai/analyze-planning
// @desc    Trigger AI analysis notification
router.post('/analyze-planning', protect, async (req, res) => {
    try {
        const { projectId } = req.body;

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'AI_ANALYSIS_COMPLETED',
                title: 'AI Analysis Completed',
                message: 'AI Project Advisor has finished analyzing your project planning and identified optimization opportunities.',
                severity: 'medium',
                projectId: projectId,
                showPopup: true
            });
        }

        res.json({ message: 'Analysis triggered' });
    } catch (err) {
        console.error('❌ AI Analysis Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/ai/generate-schedule
// @desc    Trigger Schedule generation notification
router.post('/generate-schedule', protect, async (req, res) => {
    try {
        const { projectId } = req.body;

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'SCHEDULE_GENERATED',
                title: 'Schedule Generated',
                message: 'A new AI-powered construction schedule has been generated based on your project parameters.',
                severity: 'high',
                projectId: projectId,
                showPopup: true
            });
        }

        res.json({ message: 'Schedule generated' });
    } catch (err) {
        console.error('❌ Schedule Generation Error:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
