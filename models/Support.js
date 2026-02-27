import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String },
    email: { type: String, required: true },
    requestId: { type: String, unique: true },
    issueType: { type: String, default: 'General' },
    relatedTo: { type: String },
    projectName: { type: String },
    category: { type: String },
    title: { type: String },
    message: { type: String, required: true },
    location: { type: String },
    attachments: [{ type: String }],
    standardsReference: { type: String },
    requestedAction: { type: String },
    assignTo: { type: String },
    expectedTimeline: { type: Date },
    impactIfDelayed: { type: String },
    priority: { type: String, default: 'Normal' },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Actioned', 'Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Submitted'
    },
    comments: [{
        sender: String,
        text: String,
        date: { type: Date, default: Date.now }
    }],
    approvalHistory: [{
        status: String,
        actor: String,
        note: String,
        date: { type: Date, default: Date.now }
    }],
    date: { type: Date, default: Date.now }
});

const Support = mongoose.model('Support', supportSchema);

export default Support;
