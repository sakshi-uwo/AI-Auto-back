import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Delayed'],
        default: 'Pending',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    category: {
        type: String,
        enum: ['Structural', 'Finishing', 'Inspection', 'Electrical', 'Plumbing', 'Other'],
        default: 'Structural',
    },
    locationArea: {
        type: String, // Floor, Sector, Block
    },
    assignedTeam: {
        type: String,
        default: 'General',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    duration: {
        type: Number, // in days
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    dependency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    },
    remarks: [{
        text: String,
        date: { type: Date, default: Date.now }
    }],
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    resources: {
        labor: [{ type: String }], // Assigned teams or worker roles
        materials: [{
            item: String,
            qtyNeeded: Number,
            unit: String,
            status: { type: String, enum: ['Available', 'Shortage', 'Allocated'], default: 'Available' }
        }],
        equipment: [{
            name: String,
            status: { type: String, enum: ['Available', 'In Use', 'Conflict'], default: 'Available' }
        }]
    },
    isCriticalPath: {
        type: Boolean,
        default: false
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
