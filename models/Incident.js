import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    hazardType: {
        type: String,
        enum: ['Electrical', 'Structural', 'Fire', 'Machinery', 'Chemical', 'Working at Height', 'Excavation', 'Other'],
        required: false
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    location: String,
    areaZone: String,
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Mitigated', 'Closed'],
        default: 'Open'
    },
    actionsTaken: [{
        type: String
    }],
    controlMeasures: String,
    assignedTo: String,
    dueDate: Date,
    complianceStandard: String,
    riskScore: Number,
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    attachments: [{
        type: String
    }]
}, { timestamps: true });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
