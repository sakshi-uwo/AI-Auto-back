import mongoose from 'mongoose';

const siteLogSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['general', 'material', 'weather', 'inspection'],
        default: 'general',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false // Optional for now as we might not have project context in all views
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    photos: [{
        type: String
    }],
    videos: [{
        type: String
    }],
    documents: [{
        type: String
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const SiteLog = mongoose.model('SiteLog', siteLogSchema);

export default SiteLog;
