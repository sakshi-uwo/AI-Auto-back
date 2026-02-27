import express from 'express';
import { getDashboardStats } from '../utils/dashboardUtils.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (err) {
        console.error('❌ Error fetching stats:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
