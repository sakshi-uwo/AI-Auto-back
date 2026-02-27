import express from 'express';
import Attendance from '../models/Attendance.js';
import Worker from '../models/Worker.js';

const router = express.Router();

// --- Workers ---

// Get all workers (with filters if needed)
router.get('/workers', async (req, res) => {
    try {
        const workers = await Worker.find().populate('activeAssignment.project');
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new worker with auto-generated ID
router.post('/workers', async (req, res) => {
    try {
        const count = await Worker.countDocuments();
        const workerId = `LAB-${(count + 1).toString().padStart(3, '0')}`;

        const workerData = {
            ...req.body,
            workerId: workerId
        };

        const worker = new Worker(workerData);
        const newWorker = await worker.save();

        const io = req.app.get('io');
        if (io) io.emit('workerAdded', newWorker);

        res.status(201).json(newWorker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update worker details
router.patch('/workers/:id', async (req, res) => {
    try {
        const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('activeAssignment.project');
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        const io = req.app.get('io');
        if (io) io.emit('workerUpdated', worker);

        res.json(worker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Assign worker to project/site
router.post('/workers/:id/assign', async (req, res) => {
    try {
        const { project, block, shift, startDate, endDate } = req.body;
        const worker = await Worker.findById(req.params.id);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        const assignment = { project, block, shift, startDate, endDate };
        worker.assignments.push(assignment);
        worker.activeAssignment = assignment;

        await worker.save();
        const updatedWorker = await Worker.findById(req.params.id).populate('activeAssignment.project');

        const io = req.app.get('io');
        if (io) io.emit('workerAssigned', updatedWorker);

        res.json(updatedWorker);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Attendance ---

// Get attendance for a specific date
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }
        const attendance = await Attendance.find(query).populate('workerId');
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update POST route to handle edit history
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const io = req.app.get('io');

        const processItem = async (item) => {
            const existing = await Attendance.findOne({ workerId: item.workerId, date: item.date });
            if (existing && existing.status !== item.status) {
                // If status changed, add to edit history
                item.editHistory = existing.editHistory || [];
                item.editHistory.push({
                    previousStatus: existing.status,
                    updatedStatus: item.status,
                    reason: item.remarks || 'Status correction',
                    updatedAt: new Date()
                });
            }
            return Attendance.findOneAndUpdate(
                { workerId: item.workerId, date: item.date },
                { $set: item },
                { upsert: true, new: true }
            );
        };

        if (Array.isArray(data)) {
            const results = await Promise.all(data.map(item => processItem(item)));
            if (io) io.emit('attendanceUpdated');
            res.json({ message: 'Attendance updated with history', count: results.length });
        } else {
            const result = await processItem(data);
            if (io) io.emit('attendanceUpdated', result);
            res.status(201).json(result);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get attendance reports (Daily, Weekly, Monthly)
router.get('/reports', async (req, res) => {
    try {
        const { type } = req.query; // daily, weekly, monthly
        const now = new Date();
        let startDate;

        if (type === 'weekly') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (type === 'monthly') {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        }

        const report = await Attendance.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    avgOT: { $avg: "$overtimeHours" }
                }
            }
        ]);

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance stats for today
router.get('/stats', async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [attendance, workers] = await Promise.all([
            Attendance.find({ date: { $gte: start, $lte: end } }),
            Worker.find({ status: 'Active' })
        ]);

        const stats = {
            totalWorkers: workers.length,
            present: attendance.filter(a => a.status === 'Present').length,
            absent: attendance.filter(a => a.status === 'Absent').length,
            late: attendance.filter(a => a.status === 'Late').length,
            onLeave: attendance.filter(a => a.status === 'On Leave').length,
            overtime: attendance.filter(a => a.overtimeHours > 0).length,
            halfDay: attendance.filter(a => a.status === 'Half Day').length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance stats for today
router.get('/stats', async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [attendance, workers] = await Promise.all([
            Attendance.find({ date: { $gte: start, $lte: end } }),
            Worker.find({ status: 'Active' })
        ]);

        const tradeStats = await Attendance.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $lookup: { from: 'workers', localField: 'workerId', foreignField: '_id', as: 'worker' } },
            { $unwind: '$worker' },
            {
                $group: {
                    _id: '$worker.trade',
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    total: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            totalWorkers: workers.length,
            present: attendance.filter(a => a.status === 'Present').length,
            absent: attendance.filter(a => a.status === 'Absent').length,
            late: attendance.filter(a => a.status === 'Late').length,
            onLeave: attendance.filter(a => a.status === 'On Leave').length,
            overtime: attendance.filter(a => a.overtimeHours > 0).length,
            halfDay: attendance.filter(a => a.status === 'Half Day').length,
            tradeWise: tradeStats.map(t => ({ trade: t._id, present: t.present, total: t.total }))
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance alerts (Absent critical workers, low manpower, OT threshold)
router.get('/alerts', async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [attendance, workers] = await Promise.all([
            Attendance.find({ date: { $gte: start, $lte: end } }).populate('workerId'),
            Worker.find({ status: 'Active' })
        ]);

        const alerts = [];

        // 1. Low Manpower Alert (Less than 80% present)
        const totalActiveCount = workers.length || 1;
        const attendanceRate = (attendance.filter(a => a.status === 'Present').length / totalActiveCount) * 100;
        if (attendanceRate < 80) {
            alerts.push({
                type: 'Low Manpower',
                severity: 'High',
                message: `Current site presence is at ${attendanceRate.toFixed(1)}%. Productivity may be affected.`,
                timestamp: new Date()
            });
        }

        // 2. Absent Critical Workers (Site Engineers, Health & Safety Officers)
        const criticalRoles = ['Site Engineer', 'Safety Officer', 'Foreman'];
        const absentCritical = workers.filter(w => criticalRoles.includes(w.role) && !attendance.find(a => (a.workerId._id || a.workerId).toString() === w._id.toString() && a.status === 'Present'));

        absentCritical.forEach(w => {
            alerts.push({
                type: 'Missing Critical Staff',
                severity: 'Critical',
                message: `${w.role} (${w.name}) is absent or not yet checked in.`,
                timestamp: new Date()
            });
        });

        // 3. Overtime Threshold (Anyone > 4 hours OT)
        const highOT = attendance.filter(a => a.overtimeHours > 4);
        if (highOT.length > 0) {
            alerts.push({
                type: 'OT Threshold',
                severity: 'Medium',
                message: `${highOT.length} workers have exceeded 4 hours of overtime today.`,
                timestamp: new Date()
            });
        }

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
