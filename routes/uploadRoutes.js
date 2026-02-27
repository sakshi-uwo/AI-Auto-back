import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import SiteLog from '../models/SiteLog.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Upload media and attach to a site log
router.post('/media', upload.array('files', 10), async (req, res) => {
    try {
        const { description = 'Site Progress Media', type = 'general', project: projectId } = req.body;
        const io = req.app.get('io');

        const photos = [];
        const videos = [];
        const documents = [];

        req.files.forEach(file => {
            const url = `/uploads/${file.filename}`;
            const ext = path.extname(file.originalname).toLowerCase();
            const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
            const docExts = ['.pdf', '.doc', '.docx'];

            if (videoExts.includes(ext)) {
                videos.push(url);
            } else if (docExts.includes(ext)) {
                documents.push(url);
            } else {
                photos.push(url);
            }
        });

        const log = new SiteLog({
            type,
            description,
            photos,
            videos,
            documents,
            project: projectId,
            timestamp: new Date()
        });

        const savedLog = await log.save();

        if (io) {
            io.emit('siteLogAdded', savedLog);
            if (documents.length > 0) io.emit('documentAdded', savedLog);
        }

        res.status(201).json({
            success: true,
            log: savedLog,
            photos,
            videos,
            documents
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
