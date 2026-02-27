import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave'],
        required: true
    },
    checkIn: String, // Time string like "09:00"
    checkOut: String, // Time string like "18:00"
    shift: {
        type: String,
        enum: ['Morning', 'Night', 'Custom'],
        default: 'Morning'
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    leaveType: {
        type: String,
        enum: ['Casual', 'Sick', 'Emergency', 'None'],
        default: 'None'
    },
    remarks: String,
    editHistory: [{
        previousStatus: String,
        updatedStatus: String,
        reason: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }],
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure unique attendance per worker per date
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
