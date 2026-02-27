import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: [
            'Project Master Documents',
            'Design & Planning',
            'Contracts & Legal',
            'Financial & Billing',
            'Compliance & Approvals',
            'Reports & Reviews',
            'Client-Facing Documents'
        ]
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    version: { type: String, default: 'v1.0' },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Locked', 'Archived'],
        default: 'Pending'
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    fileSize: { type: String },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalAuthority: { type: String, default: 'Builder' },
    isSharedWithClient: { type: Boolean, default: false },
    expiryDate: { type: Date },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    versionHistory: [{
        version: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
