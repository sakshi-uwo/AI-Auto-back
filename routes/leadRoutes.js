import express from 'express';
import Lead from '../models/Lead.js';
import { getDashboardStats } from '../utils/dashboardUtils.js';
import { calculateLeadScore } from '../utils/leadScoring.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to emit dashboard updates
const emitDashboardUpdate = async (app) => {
    const io = app.get('io');
    if (io) {
        const stats = await getDashboardStats();
        io.emit('dashboard-update', stats);
        console.log('📢 Real-time event emitted: dashboard-update');
    }
};

// @route   GET /api/lead
// @desc    Get all leads with populated user data
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find()
            .populate('user', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        console.error('❌ Error fetching leads:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/lead
// @desc    Create a new lead with flexible fields and emit socket event
router.post('/', async (req, res) => {
    try {
        const { user, source, name, email, phone, status, projectInterest, isSimulated } = req.body;

        if (!source) return res.status(400).json({ message: 'Source missing' });

        // PRODUCTION SAFETY: Block simulation in production environments
        if (isSimulated && process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Lead simulation is disabled in production.' });
        }

        // ROLE PROTECTION: Only Admins can trigger simulation
        if (isSimulated) {
            // We use a manual check here if we don't want to wrap the whole route in protect
            // but for simulation, it's better to ensure who is doing it
            const userRole = req.headers['x-user-role'] || (req.user && req.user.role);
            if (userRole?.toLowerCase() !== 'admin') {
                return res.status(403).json({ message: 'Only administrators can simulate leads.' });
            }
        }

        const newLead = new Lead({
            user: user || null,
            name,
            email,
            phone,
            source,
            sourceType: isSimulated ? 'simulation' : 'real',
            status: status || 'New',
            projectInterest,
            isSimulated: isSimulated || false,
            lastEngagementAt: new Date()
        });

        // Calculate initial score
        const { score, temperature } = calculateLeadScore(newLead);
        newLead.leadScore = score;
        newLead.leadTemperature = temperature;
        if (temperature !== 'Cold') {
            newLead.status = temperature;
        }

        const saved = await newLead.save();

        const populatedLead = await Lead.findById(saved._id)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');

        const io = req.app.get('io');
        if (io) {
            io.emit('lead-added', populatedLead);
            console.log('📢 Real-time event emitted: lead-added', populatedLead.name || 'Anonymous');
        }

        // Also emit dashboard update
        await emitDashboardUpdate(req.app);

        res.status(201).json(populatedLead);
    } catch (err) {
        console.error('❌ Error saving lead:', err.stack || err);
        res.status(500).json({ error: err.message });
    }
});

// @route   PATCH /api/lead/:id
// @desc    Update lead status, signals, and recalculate score
router.patch('/:id', async (req, res) => {
    try {
        const currentLead = await Lead.findById(req.params.id);
        if (!currentLead) return res.status(404).json({ message: 'Lead not found' });

        const { signal, ...otherUpdates } = req.body;

        // Add new signal if provided
        if (signal) {
            currentLead.engagementSignals.push({
                type: signal.type,
                timestamp: new Date(),
                metadata: signal.metadata
            });
            currentLead.lastEngagementAt = new Date();
        }

        // Update other fields
        Object.assign(currentLead, otherUpdates);

        // Recalculate score
        const oldTemp = currentLead.leadTemperature;
        const { score, temperature } = calculateLeadScore(currentLead);
        currentLead.leadScore = score;
        currentLead.leadTemperature = temperature;

        // Auto-update status based on temperature if it improved or is Hot
        if (temperature === 'Hot' || (temperature === 'Warm' && currentLead.status === 'New')) {
            currentLead.status = temperature;
        }

        const lead = await currentLead.save();

        const populatedLead = await Lead.findById(lead._id)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('lead-updated', populatedLead);

            // Special notification for temperature change to Hot
            if (oldTemp !== 'Hot' && temperature === 'Hot') {
                io.emit('lead-hot-alert', populatedLead);
            }
        }

        // Also emit dashboard update
        await emitDashboardUpdate(req.app);

        res.json(populatedLead);
    } catch (err) {
        console.error('❌ Error updating lead:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/lead/:id/signal
// @desc    Proxy to patch for adding behavioral signals easily
router.post('/:id/signal', async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        lead.engagementSignals.push({
            type: req.body.type,
            timestamp: new Date(),
            metadata: req.body.metadata
        });
        lead.lastEngagementAt = new Date();

        const { score, temperature } = calculateLeadScore(lead);
        lead.leadScore = score;
        lead.leadTemperature = temperature;

        await lead.save();

        const io = req.app.get('io');
        if (io) io.emit('lead-updated', lead);

        res.json(lead);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
