import express from 'express';
import Document from '../models/Document.js';
import { protect } from '../middleware/authMiddleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// @route   GET /api/documents
router.get('/', async (req, res) => {
    try {
        const { projectId, category } = req.query;
        let query = {};
        if (projectId) query.projectId = projectId;
        if (category) query.category = category;

        const docs = await Document.find(query)
            .populate('projectId', 'name')
            .populate('uploadedBy', 'name role')
            .sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        console.error('❌ Error fetching documents:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/documents
router.post('/', protect, async (req, res) => {
    try {
        const newDoc = new Document(req.body);
        const saved = await newDoc.save();

        // Trigger Builder Notification
        if (req.user && req.user.role?.toLowerCase() === 'builder') {
            await NotificationService.createBuilderNotification({
                recipientId: req.user._id,
                type: 'DOCUMENT_UPLOADED',
                title: 'Document Uploaded',
                message: `Document "${saved.fileName || saved.title}" has been successfully uploaded.`,
                severity: 'medium',
                projectId: saved.projectId,
                referenceId: saved._id,
                showPopup: true
            });
        }

        const io = req.app.get('io');
        if (io) io.emit('document-added', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving document:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/documents/:id
router.patch('/:id', async (req, res) => {
    try {
        const doc = await Document.findByIdAndUpdate(
            req.params.id,
            { $set: req.body, updatedAt: Date.now() },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) io.emit('document-updated', doc);

        res.json(doc);
    } catch (err) {
        console.error('❌ Error updating document:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/documents/:id/version
router.post('/:id/version', async (req, res) => {
    try {
        const { fileUrl, version, uploadedBy } = req.body;
        const mainDoc = await Document.findById(req.params.id);

        if (mainDoc.status === 'Locked') {
            return res.status(403).json({ message: 'Document is locked and cannot be versioned' });
        }

        // Add current to history
        mainDoc.versionHistory.push({
            version: mainDoc.version,
            fileUrl: mainDoc.fileUrl,
            uploadedBy: mainDoc.uploadedBy
        });

        // Update main
        mainDoc.version = version;
        mainDoc.fileUrl = fileUrl;
        mainDoc.uploadedBy = uploadedBy;
        mainDoc.updatedAt = Date.now();

        const saved = await mainDoc.save();
        res.json(saved);
    } catch (err) {
        console.error('❌ Error versioning document:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
