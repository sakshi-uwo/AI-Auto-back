import 'dotenv/config';
import mongoose from 'mongoose';
import notificationService from './services/NotificationService.js';
import ScheduledNotification from './models/ScheduledNotification.js';

const testExcelParsing = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const filePath = '../example.xlsx'; // Based on root dir search earlier
        console.log(`🧪 Testing Excel Parsing for: ${filePath}`);

        const result = await notificationService.processExcelUpload(filePath);
        console.log('📈 Parsing Result:', result);

        const saved = await ScheduledNotification.find({ status: 'PENDING' }).sort({ createdAt: -1 }).limit(result.count);
        console.log(`💾 Verified ${saved.length} notifications saved to DB.`);

        if (saved.length > 0) {
            console.log('📝 Sample entry:', {
                email: saved[0].recipientEmail,
                date: saved[0].scheduledDate,
                desc: saved[0].description
            });
        }

        // Test the scheduler logic 
        console.log('🕒 Testing due notification check...');
        // To ensure they are marked "due", we might need to update the date of one entry
        if (saved.length > 0) {
            saved[0].scheduledDate = new Date(); // Make it due now
            await saved[0].save();
        }

        await notificationService.checkAndSendScheduledNotifications();

        const afterCheck = await ScheduledNotification.findById(saved[0]._id);
        console.log(`🏁 Status after check: ${afterCheck.status}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
};

testExcelParsing();
