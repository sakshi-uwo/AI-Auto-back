import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead.js';

dotenv.config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('Connected to MongoDB for migration...');

        // 1. Update all 'New' status to 'Warm'
        const statusResult = await Lead.updateMany(
            { status: 'New' },
            { $set: { status: 'Warm' } }
        );
        console.log(`Updated ${statusResult.modifiedCount} leads from 'New' to 'Warm'`);

        // 2. Update all generic or missing names to include source
        const leadsToFix = await Lead.find({
            $or: [
                { name: 'Visitor' },
                { name: null },
                { name: { $exists: false } },
                { name: 'undefined' },
                { name: '' }
            ]
        });
        let nameFixCount = 0;
        for (const lead of leadsToFix) {
            const newName = lead.source ? `${lead.source} Visitor` : 'Guest Visitor';
            await Lead.updateOne({ _id: lead._id }, { $set: { name: newName } });
            nameFixCount++;
        }
        console.log(`Updated ${nameFixCount} lead names from 'Visitor' to specific platform visitors`);

        await mongoose.connection.close();
        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
