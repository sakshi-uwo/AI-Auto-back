import mongoose from 'mongoose';

const SiteVisitSchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    visitDate: {
        type: Date,
        required: true
    },
    executive: {
        type: String,
        default: 'Sales Representative'
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
        default: 'Scheduled'
    }
}, { timestamps: true });

export default mongoose.model('SiteVisit', SiteVisitSchema);
