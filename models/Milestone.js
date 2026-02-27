import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Completed', 'Upcoming', 'Delayed'],
        default: 'Upcoming',
    },
    description: {
        type: String,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
