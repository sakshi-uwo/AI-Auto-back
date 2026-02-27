import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    realTimeSync: { type: Boolean, default: true },
    publicRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceNotice: { type: String, default: "System is under maintenance. Please try again later." },
    maintenanceWindow: {
        startTime: { type: Date },
        endTime: { type: Date }
    },
    autoDisableMaintenance: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SystemSettings', systemSettingsSchema);
