import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(10);

        console.log('--- Recent Leads ---');
        leads.forEach(l => {
            console.log(`Name: ${l.name} | Source: ${l.source} | Status: ${l.status}`);
        });

        const newCount = await Lead.countDocuments({ status: 'New' });
        console.log(`\nLeads with 'New' status: ${newCount}`);

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

check();
