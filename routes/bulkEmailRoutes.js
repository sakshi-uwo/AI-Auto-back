import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import notificationService from '../services/NotificationService.js';
import ScheduledNotification from '../models/ScheduledNotification.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer config for Excel uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/bulk-emails';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `bulk-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// @route   POST /api/bulk-email/upload
// @desc    Upload Excel file for bulk email scheduling
router.post('/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an Excel file' });
        }

        const result = await notificationService.processExcelUpload(req.file.path);

        res.json({
            message: `Successfully processed Excel file. ${result.count} notifications scheduled.`,
            count: result.count
        });
    } catch (err) {
        console.error('❌ Bulk Upload Route Error:', err.message);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
});

// @route   GET /api/bulk-email/status
// @desc    Get status of scheduled notifications
router.get('/status', protect, authorize('admin'), async (req, res) => {
    try {
        const stats = await ScheduledNotification.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const recent = await ScheduledNotification.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            stats: stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            recent
        });
    } catch (err) {
        console.error('❌ Bulk Status Route Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// @route   DELETE /api/bulk-email/:id
// @desc    Delete a specific notification
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const note = await ScheduledNotification.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await note.deleteOne();
        res.json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error('❌ Bulk Delete Error:', err.message);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// @route   PATCH /api/bulk-email/:id
// @desc    Update a specific notification (e.g. description)
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { description } = req.body;
        const note = await ScheduledNotification.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (description !== undefined) note.description = description;

        await note.save();
        res.json({ message: 'Notification updated successfully', note });
    } catch (err) {
        console.error('❌ Bulk Update Error:', err.message);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

export default router;
