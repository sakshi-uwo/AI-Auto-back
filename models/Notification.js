import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    isRead: { // Added for explicit requirement
        type: Boolean,
        default: false
    },
    dashboard: {
        type: String,
        enum: ['BUILDER', 'ADMIN', 'ENGINEER', 'SITE_MANAGER', 'CLIENT'],
        default: 'BUILDER'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    referenceId: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    severity: { // Added for explicit requirement
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    channelsSent: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;