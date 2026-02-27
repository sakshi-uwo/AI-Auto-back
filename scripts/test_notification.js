import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';

// Force DNS to use Google's servers to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import notificationService from '../services/NotificationService.js';
import User from '../models/User.js';

/**
 * Test script to trigger various notification events.
 */
async function runTest() {
    try {
        console.log('🚀 Starting Notification System Test...');

        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('✅ Connected to MongoDB');

        // Ensure we have some users with roles
        const admin = await User.findOne({ role: 'Admin' });
        const client = await User.findOne({ role: 'Client' });
        const builder = await User.findOne({ role: 'Builder' });

        if (!admin || !client) {
            console.error('❌ Could not find Admin or Client user in database. Please ensure users are seeded.');
            process.exit(1);
        }

        console.log(`Found Admin: ${admin.email}, Client: ${client.email}, Builder: ${builder?.email || 'N/A'}`);

        // 1. Trigger Hazard Event (Should Notify Admin & Engineer)
        console.log('\n--- Case 1: Hazard Reported ---');
        await notificationService.triggerNotification('hazard', {
            title: '☢️ Safety Hazard Reported',
            message: 'A gas leak was detected in Sector B. Immediate action required.',
            priority: 'urgent',
            metadata: { location: 'Sector B', reporter: 'Site Manager' }
        });

        // 2. Trigger Milestone Event (Should Notify Client & Admin)
        console.log('\n--- Case 2: Milestone Completed ---');
        await notificationService.triggerNotification('milestone', {
            title: '🏆 Foundation Complete',
            message: 'Phase 1 construction milestone "Foundation" has been successfully completed.',
            metadata: { project: 'Skyline Towers', phase: 1 }
        });

        // 3. Trigger Budget Event (Should Notify Client & Admin)
        console.log('\n--- Case 3: Budget Exceeded ---');
        await notificationService.triggerNotification('budget_exceeded', {
            title: '⚠️ Budget Alert',
            message: 'Project "Green Valley" has exceeded its monthly material budget by 15%.',
            priority: 'high'
        });

        console.log('\n✅ Verification events triggered. Check your dashboard bell icon!');

        // Wait a bit for async operations
        setTimeout(() => {
            mongoose.disconnect();
            process.exit(0);
        }, 2000);

    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

runTest();