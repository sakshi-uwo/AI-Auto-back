import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// @route   GET /api/tasks/project/:projectId
router.get('/project/:projectId', async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId }).populate('dependency').sort({ startDate: 1 });
        res.json(tasks);
    } catch (err) {
        console.error('❌ Error fetching project tasks:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('dependency').sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error('❌ Error fetching tasks:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks
router.post('/', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        const saved = await newTask.save();

        const io = req.app.get('io');
        if (io) io.emit('taskUpdated', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving task:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // If progress is changed to 100, set status to Completed
        if (req.body.progress === 100) {
            req.body.status = 'Completed';
        } else if (req.body.progress > 0 && req.body.progress < 100) {
            req.body.status = 'In Progress';
        }

        // Add remark if provided
        if (req.body.remark) {
            task.remarks.push({ text: req.body.remark });
            delete req.body.remark;
        }

        const updated = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('dependency');

        const io = req.app.get('io');
        if (io) io.emit('taskUpdated', updated);

        res.json(updated);
    } catch (err) {
        console.error('❌ Error updating task:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
