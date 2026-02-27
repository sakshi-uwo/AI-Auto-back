import cron from 'node-cron';
import notificationService from '../services/NotificationService.js';
import leadService from '../services/LeadService.js';

/**
 * AI_AUTO Notification Scheduler
 * Runs periodic tasks for the notification system.
 */
class Scheduler {
    constructor() {
        this.jobs = [];
    }

    /**
     * Initialize all cron jobs
     */
    init() {
        console.log('⏲️ Initializing Cron Jobs...');

        // Run every minute to check for scheduled notifications
        const notificationJob = cron.schedule('* * * * *', () => {
            notificationService.checkAndSendScheduledNotifications().catch(err => {
                console.error('❌ Scheduler Error (Notifications):', err);
            });
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        this.jobs.push(notificationJob);

        // Run daily at midnight to process lead score decay
        const leadDecayJob = cron.schedule('0 0 * * *', () => {
            leadService.processTimeDecay().catch(err => {
                console.error('❌ Scheduler Error (Lead Decay):', err);
            });
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        this.jobs.push(leadDecayJob);
        console.log('✅ Cron Jobs started (Scheduled Notifications: Every 1 min, Lead Decay: Daily at Midnight)');
    }

    /**
     * Stop all cron jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('🛑 Cron Jobs stopped.');
    }
}

export default new Scheduler();
