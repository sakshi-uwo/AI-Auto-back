import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

// @route   GET /api/payments
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        console.error('❌ Error fetching payments:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/payments/project/:projectId
router.get('/project/:projectId', async (req, res) => {
    try {
        const payments = await Payment.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        console.error('❌ Error fetching payments:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/payments
router.post('/', async (req, res) => {
    try {
        const newPayment = new Payment(req.body);
        const saved = await newPayment.save();

        const io = req.app.get('io');
        if (io) io.emit('paymentUpdated', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving payment:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
