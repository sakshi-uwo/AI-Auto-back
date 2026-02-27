import mongoose from 'mongoose';

const notificationSettingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    preferences: [{
        eventType: {
            type: String,
            required: true
        },
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        }
    }]
}, { timestamps: true });

const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);

export default NotificationSetting;