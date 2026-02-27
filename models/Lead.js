import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    source: {
        type: String,
        required: true,
        default: 'Direct'
    },
    status: {
        type: String,
        enum: ['New', 'Hot', 'Warm', 'Cold', 'Converted'],
        default: 'New'
    },
    leadScore: {
        type: Number,
        default: 0
    },
    leadTemperature: {
        type: String,
        enum: ['Hot', 'Warm', 'Cold'],
        default: 'Cold'
    },
    lastEngagementAt: {
        type: Date,
        default: Date.now
    },
    engagementSignals: [{
        type: { type: String },
        timestamp: { type: Date, default: Date.now },
        metadata: mongoose.Schema.Types.Mixed
    }],
    isSimulated: {
        type: Boolean,
        default: false
    },
    sourceType: {
        type: String,
        enum: ['real', 'simulation'],
        default: 'real'
    },
    projectInterest: {
        type: String,
        required: false
    },
    industry: {
        type: String,
        required: false
    },
    companySize: {
        type: String,
        required: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
