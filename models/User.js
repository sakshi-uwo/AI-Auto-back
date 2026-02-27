import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'Builder', 'Civil Engineer', 'Site Manager', 'Client'],
        default: 'Client',
    },
    status: {
        type: String,
        enum: ['Active', 'Pending', 'Inactive'],
        default: 'Pending',
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    refreshTokens: [{
        type: String,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema);

export default User;
