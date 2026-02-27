import mongoose from 'mongoose';
import 'dotenv/config';
import Lead from '../models/Lead.js';

const MONGODB_URI = process.env.MONGODB_ATLAS_URI;

async function removeDuplicateLeads() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all leads (without populate to avoid errors)
        const allLeads = await Lead.find();
        console.log(`📊 Total leads found: ${allLeads.length}`);

        // Group leads by user+source combination
        const leadMap = new Map();
        const duplicatesToDelete = [];

        for (const lead of allLeads) {
            if (!lead.user) {
                // Delete leads without user reference
                duplicatesToDelete.push(lead._id);
                console.log(`🗑️  Found lead without user reference - marking for deletion`);
                continue;
            }

            const key = `${lead.user}_${lead.source}`;

            if (leadMap.has(key)) {
                // This is a duplicate - mark for deletion
                duplicatesToDelete.push(lead._id);
                console.log(`🔍 Found duplicate: User ${lead.user} - ${lead.source}`);
            } else {
                // First occurrence - keep it
                leadMap.set(key, lead);
            }
        }

        if (duplicatesToDelete.length > 0) {
            // Delete duplicates
            const result = await Lead.deleteMany({ _id: { $in: duplicatesToDelete } });
            console.log(`✨ Removed ${result.deletedCount} duplicate/invalid leads`);
        } else {
            console.log('✨ No duplicates found!');
        }

        console.log(`📈 Final lead count: ${leadMap.size}`);

        await mongoose.connection.close();
        console.log('✅ Cleanup complete!');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

removeDuplicateLeads();
