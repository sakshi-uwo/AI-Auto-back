import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import 'dotenv/config';

async function test() {
    try {
        console.log('Connecting to:', process.env.MONGODB_ATLAS_URI);
        // Connect to local mongo WITHOUT dns overrides
        await mongoose.connect('mongodb://127.0.0.1:27017/AI-Auto');
        console.log('Connected!');

        const lead = new Lead({
            name: 'Test Agent Lead',
            email: 'agent@test.com',
            phone: '1234567890',
            source: 'Test',
            status: 'Hot',
            projectInterest: 'Test Project'
        });

        const saved = await lead.save();
        console.log('Saved Lead:', saved);

        const count = await Lead.countDocuments();
        console.log('New Lead Count:', count);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
