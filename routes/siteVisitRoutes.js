import express from 'express';
import SiteVisit from '../models/SiteVisit.js';

const router = express.Router();

// @route   GET /api/site-visits
// @desc    Get all site visits
router.get('/', async (req, res) => {
    try {
        const visits = await SiteVisit.find()
            .populate('lead', 'name phone')
            .populate('project', 'title location')
            .sort({ visitDate: 1 });
        res.json(visits);
    } catch (err) {
        console.error('❌ Error fetching site visits:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/site-visits
// @desc    Schedule a new site visit
router.post('/', async (req, res) => {
    try {
        const { lead, project, visitDate, executive, status } = req.body;

        if (!lead || !project || !visitDate) {
            return res.status(400).json({ message: 'Please provide lead, project, and date' });
        }

        const newVisit = new SiteVisit({
            lead,
            project,
            visitDate,
            executive,
            status: status || 'Scheduled'
        });

        const savedVisit = await newVisit.save();
        const populatedVisit = await savedVisit.populate([
            { path: 'lead', select: 'name phone' },
            { path: 'project', select: 'title location' }
        ]);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('visit-scheduled', populatedVisit);
            console.log('📢 Real-time event emitted: visit-scheduled', savedVisit._id);
        }

        res.status(201).json(populatedVisit);
    } catch (err) {
        console.error('❌ Error scheduling visit:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/site-visits/:id
// @desc    Update visit status
router.patch('/:id', async (req, res) => {
    try {
        const visit = await SiteVisit.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        ).populate([
            { path: 'lead', select: 'name phone' },
            { path: 'project', select: 'title location' }
        ]);

        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('visit-status-updated', visit);
        }

        res.json(visit);
    } catch (err) {
        console.error('❌ Error updating visit:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
