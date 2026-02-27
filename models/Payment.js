import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue'],
        default: 'Pending',
    },
    method: {
        type: String,
        default: 'Bank Transfer'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
