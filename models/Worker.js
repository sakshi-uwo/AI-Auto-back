import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
    workerId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String, // Mason, Carpenter, Electrician, Helper, etc.
        required: true
    },
    contractor: {
        type: String,
        required: true
    },
    tradeType: {
        type: String, // Civil, Electrical, Plumbing, etc.
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    phoneNumber: String,
    wageType: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly'],
        required: true
    },
    wageAmount: {
        type: Number,
        required: true
    },
    idProof: String,
    assignments: [{
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        block: String,
        shift: { type: String, enum: ['Morning', 'Night', 'General'], default: 'Morning' },
        startDate: Date,
        endDate: Date
    }],
    activeAssignment: {
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        block: String,
        shift: { type: String, enum: ['Morning', 'Night', 'General'], default: 'Morning' },
        startDate: Date,
        endDate: Date
    }
}, { timestamps: true });

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;
