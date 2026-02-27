import mongoose from 'mongoose';

const scheduledNotificationSchema = new mongoose.Schema({
    recipientEmail: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED'],
        default: 'PENDING',
        index: true
    },
    errorLog: {
        type: String
    },
    whatsappNumber: {
        type: String,
        default: null
    },
    whatsappStatus: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
        default: 'SKIPPED'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

const ScheduledNotification = mongoose.model('ScheduledNotification', scheduledNotificationSchema);

export default ScheduledNotification;
