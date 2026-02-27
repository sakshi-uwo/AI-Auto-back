import express from 'express';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/authMiddleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find()
            .populate('projectId', 'name')
            .sort({ createdAt: -1 });
        res.json(expenses);
    } catch (err) {
        console.error('❌ Error fetching expenses:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/expenses/:id
router.patch('/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('projectId', 'name');

        if (!updated) return res.status(404).json({ message: 'Expense found' });

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder' && status) {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'EXPENSE_DECISION',
                title: 'Expense Decision',
                message: `Expense for "${updated.category}" has been ${status.toLowerCase()} for project "${updated.projectId?.name || 'General'}".`,
                severity: status === 'Declined' ? 'high' : 'medium',
                projectId: updated.projectId?._id,
                referenceId: updated._id,
                showPopup: true
            });
        }

        res.json(updated);
    } catch (err) {
        console.error('❌ Error updating expense:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/expenses
router.post('/', async (req, res) => {
    try {
        const newExpense = new Expense(req.body);
        const saved = await newExpense.save();

        const io = req.app.get('io');
        if (io) io.emit('expense-added', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving expense:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
