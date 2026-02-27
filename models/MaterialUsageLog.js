import mongoose from 'mongoose';

const materialUsageLogSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    materialName: { type: String, required: true },
    category: { type: String },
    unit: { type: String },

    date: { type: Date, default: Date.now },
    recordedBy: { type: String, default: 'Site Manager' },
    projectSite: { type: String, default: 'Current Site' },

    quantityUsed: { type: Number, required: true },
    openingStock: { type: Number, default: 0 },
    remainingStock: { type: Number, default: 0 },

    purpose: {
        type: String,
        enum: ['Foundation', 'Slab Casting', 'Column Work', 'Brickwork', 'Plastering', 'Repair', 'Other'],
        default: 'Other'
    },
    source: {
        type: String,
        enum: ['From Site Inventory', 'From New Delivery', 'Borrowed'],
        default: 'From Site Inventory'
    },
    linkedTask: { type: String, default: '' },
    remarks: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Recorded', 'Requested Refill'],
        default: 'Recorded'
    },
    isOverStock: { type: Boolean, default: false },
    attachments: [{ type: String }],

    createdAt: { type: Date, default: Date.now }
});

const MaterialUsageLog = mongoose.model('MaterialUsageLog', materialUsageLogSchema);
export default MaterialUsageLog;
