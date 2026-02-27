import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    item: { type: String, required: true },
    category: {
        type: String,
        enum: ['Cement', 'Steel', 'Aggregate', 'Sand', 'Bricks', 'Finishing', 'Other'],
        default: 'Other'
    },
    unit: {
        type: String,
        enum: ['Bags', 'Kg', 'Ton', 'Cubic Meter', 'Nos', 'Litre'],
        default: 'Bags'
    },
    qty: { type: Number, default: 0 },           // current stock (opening)
    usedQty: { type: Number, default: 0 },        // used today
    remainingQty: { type: Number, default: 0 },   // auto-calculated
    lowStockThreshold: { type: Number, default: 10 },
    status: {
        type: String,
        enum: ['Available', 'Requested', 'In Transit', 'Arrived', 'Low Stock'],
        default: 'Available',
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    createdAt: { type: Date, default: Date.now }
});

const Material = mongoose.model('Material', materialSchema);
export default Material;
