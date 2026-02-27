import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['Basic', 'Pro', 'Enterprise'],
        default: 'Basic'
    },
    status: {
        type: String,
        enum: ['Active', 'Past Due', 'Canceled', 'Trialing'],
        default: 'Active'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    usage: {
        projects: { used: { type: Number, default: 0 }, limit: { type: Number, default: 5 } },
        users: { used: { type: Number, default: 0 }, limit: { type: Number, default: 10 } },
        automationRuns: { used: { type: Number, default: 0 }, limit: { type: Number, default: 500 } },
        aiPredictions: { used: { type: Number, default: 0 }, limit: { type: Number, default: 100 } },
        storageGB: { used: { type: Number, default: 0 }, limit: { type: Number, default: 10 } }
    },
    nextBillingDate: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Billing = mongoose.model('Billing', billingSchema);
export default Billing;
