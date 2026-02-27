import 'dotenv/config';
import mongoose from 'mongoose';
import ScheduledNotification from './models/ScheduledNotification.js';

const checkRecords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const now = new Date();
        const records = await ScheduledNotification.find().sort({ createdAt: -1 }).limit(10);

        console.log('Current Server Time:', now.toISOString());
        console.log('--- RECENT RECORDS ---');
        records.forEach(r => {
            console.log(`ID: ${r._id} | Email: ${r.recipientEmail} | Status: ${r.status} | Scheduled: ${r.scheduledDate.toISOString()} | Due: ${r.scheduledDate <= now}`);
        });

        const pendingCount = await ScheduledNotification.countDocuments({ status: 'PENDING' });
        const duePendingCount = await ScheduledNotification.countDocuments({ status: 'PENDING', scheduledDate: { $lte: now } });

        console.log('--- STATS ---');
        console.log('Total Pending:', pendingCount);
        console.log('Due Pending (<= now):', duePendingCount);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkRecords();
