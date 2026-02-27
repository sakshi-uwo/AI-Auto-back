import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import 'dotenv/config';

async function seed() {
    try {
        const uri = 'mongodb://localhost:27017/AI-Auto';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected!');

        const leads = [
            { name: 'John Doe', email: 'john@example.com', phone: '1234567890', source: 'WhatsApp', status: 'Hot', projectInterest: 'Skyline Towers' },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', source: 'Instagram', status: 'Warm', projectInterest: 'Green Valley' }
        ];

        for (const l of leads) {
            try {
                const lead = new Lead(l);
                await lead.save();
                console.log('Saved:', l.name);
            } catch (e) {
                console.error('Failed to save', l.name, ':', e.message);
            }
        }

        const count = await Lead.countDocuments();
        console.log('Total Leads now:', count);
        await mongoose.connection.close();
    } catch (err) {
        console.error('FATAL ERROR:', err);
    }
}

seed();
