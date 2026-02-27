import express from 'express';
import Project from '../models/Project.js';
import { protect } from '../middleware/authMiddleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate('assignedTo', 'name email role');
        res.json(projects);
    } catch (err) {
        console.error('❌ Error fetching projects:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/projects/:id
// @desc    Get a single project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('assignedTo', 'name email role');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error('❌ Error fetching project:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/projects
// @desc    Create a new project and emit socket event
router.post('/', protect, async (req, res) => {
    try {
        const { name, location, startDate, endDate, description, assignedTo, status, totalUnits, soldUnits, budget, spent, progress } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Please provide project name' });
        }

        const newProject = new Project({
            name,
            location,
            startDate,
            endDate,
            description,
            assignedTo,
            status: status || 'In Progress',
            totalUnits: totalUnits || 0,
            soldUnits: soldUnits || 0,
            budget: budget || '$0',
            spent: spent || '$0',
            progress: progress || 0
        });

        const savedProject = await newProject.save();

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'PROJECT_CREATED',
                title: 'Project Created',
                message: `Project "${name}" has been successfully initialized.`,
                severity: 'medium',
                projectId: savedProject._id,
                showPopup: true
            });
        }

        // Emit socket event for dashboard updates
        const io = req.app.get('io');
        if (io) {
            io.emit('project-added', savedProject);
            console.log('📢 Real-time event emitted: project-added', savedProject._id);
        }

        res.status(201).json(savedProject);
    } catch (err) {
        console.error('❌ Error saving project:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/projects/:id
// @desc    Update a project and emit socket event
router.patch('/:id', protect, async (req, res) => {
    try {
        const { budget, spent } = req.body;
        const oldProject = await Project.findById(req.params.id);

        const updated = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('assignedTo', 'name email role');

        if (!updated) return res.status(404).json({ message: 'Project not found' });

        // Trigger Budget Update Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            if (budget !== undefined && budget !== oldProject.budget) {
                await NotificationService.createBuilderNotification({
                    recipientId: req.user._id,
                    type: 'BUDGET_UPDATE',
                    title: 'Budget Updated',
                    message: `Financial figures for project "${updated.name}" have been updated to ${budget}.`,
                    severity: 'high',
                    projectId: updated._id,
                    showPopup: true
                });
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('projectUpdated', updated);
            console.log('📢 Real-time event emitted: projectUpdated', updated._id);
        }

        res.json(updated);
    } catch (err) {
        console.error('❌ Error updating project:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
