import express from 'express';
import SiteLog from '../models/SiteLog.js';
import Incident from '../models/Incident.js';

const router = express.Router();

// --- Site Logs ---

// Get all site logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await SiteLog.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new site log
router.post('/logs', async (req, res) => {
    try {
        const log = new SiteLog(req.body);
        const newLog = await log.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('siteLogAdded', newLog);

        res.status(201).json(newLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Incidents (Safety Issues) ---

// Get all incidents
router.get('/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ severity: 1, createdAt: -1 }); // High severity first if mapped correctly, otherwise sort by date
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new incident
router.post('/incidents', async (req, res) => {
    try {
        const incident = new Incident(req.body);
        const newIncident = await incident.save();

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('incidentReported', newIncident);

        res.status(201).json(newIncident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an incident
router.patch('/incidents/:id', async (req, res) => {
    try {
        const updated = await Incident.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Incident not found' });

        const io = req.app.get('io');
        if (io) io.emit('incidentUpdated', updated);

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
