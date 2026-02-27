import express from 'express';
import Material from '../models/Material.js';
import MaterialUsageLog from '../models/MaterialUsageLog.js';

const router = express.Router();

// ─── MATERIALS (Inventory) ───────────────────────────────────────────────────

// GET all materials
router.get('/', async (req, res) => {
    try {
        const materials = await Material.find().sort({ createdAt: -1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create material
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Auto-set remainingQty = qty on creation
        if (data.qty !== undefined && data.remainingQty === undefined) {
            data.remainingQty = data.qty;
        }
        const newMaterial = new Material(data);
        const saved = await newMaterial.save();

        const io = req.app.get('io');
        if (io) io.emit('material-added', saved);

        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH update material
router.patch('/:id', async (req, res) => {
    try {
        const updated = await Material.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Material not found' });

        const io = req.app.get('io');
        if (io) io.emit('materialUpdated', updated);

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ─── USAGE LOGS ──────────────────────────────────────────────────────────────

// GET all usage logs
router.get('/usage-logs', async (req, res) => {
    try {
        const logs = await MaterialUsageLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST record usage — deducts from inventory
router.post('/record-usage', async (req, res) => {
    try {
        const {
            materialId, quantityUsed, purpose, source,
            linkedTask, remarks, recordedBy, projectSite,
            date, requestRefill
        } = req.body;

        // Find the material
        const material = await Material.findById(materialId);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        const openingStock = material.remainingQty ?? material.qty ?? 0;
        const isOverStock = quantityUsed > openingStock;
        const remainingStock = Math.max(0, openingStock - quantityUsed);

        // Determine new status
        let newStatus = 'Available';
        if (requestRefill || isOverStock) {
            newStatus = 'Requested';
        } else if (remainingStock <= material.lowStockThreshold) {
            newStatus = 'Low Stock';
        }

        // Update the material inventory
        await Material.findByIdAndUpdate(materialId, {
            $set: {
                remainingQty: remainingStock,
                usedQty: (material.usedQty || 0) + quantityUsed,
                status: newStatus
            }
        });

        // Create the usage log entry
        const log = new MaterialUsageLog({
            materialId,
            materialName: material.item,
            category: material.category,
            unit: material.unit,
            date: date || new Date(),
            recordedBy: recordedBy || 'Site Manager',
            projectSite: projectSite || 'Current Site',
            quantityUsed,
            openingStock,
            remainingStock,
            purpose: purpose || 'Other',
            source: source || 'From Site Inventory',
            linkedTask: linkedTask || '',
            remarks: remarks || '',
            status: requestRefill ? 'Requested Refill' : 'Recorded',
            isOverStock
        });

        const savedLog = await log.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('usageLogged', savedLog);
            io.emit('materialUpdated', await Material.findById(materialId));
            if (remainingStock <= material.lowStockThreshold) {
                io.emit('lowStockAlert', { material: material.item, remaining: remainingStock });
            }
        }

        res.status(201).json({ log: savedLog, isOverStock, remainingStock });
    } catch (err) {
        console.error('❌ Error recording usage:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
