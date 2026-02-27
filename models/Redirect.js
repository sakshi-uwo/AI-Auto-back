import mongoose from 'mongoose';

const redirectSchema = new mongoose.Schema({
    source: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    count: {
        type: Number,
        default: 0
    },
    lastClicked: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Redirect = mongoose.model('Redirect', redirectSchema);

export default Redirect;
