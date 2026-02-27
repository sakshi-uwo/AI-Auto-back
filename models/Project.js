import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        default: ""
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Active', 'Draft', 'Upcoming'],
        default: 'In Progress',
    },
    description: {
        type: String,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    totalUnits: {
        type: Number,
        default: 0
    },
    soldUnits: {
        type: Number,
        default: 0
    },
    budget: {
        type: String,
        default: "$0"
    },
    spent: {
        type: String,
        default: "$0"
    },
    progress: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
