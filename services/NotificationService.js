import Notification from '../models/Notification.js';
import NotificationSetting from '../models/NotificationSettings.js';
import User from '../models/User.js';
import emailService from '../utils/emailService.js';
import ScheduledNotification from '../models/ScheduledNotification.js';
import xlsx from 'xlsx';

/**
 * AI_AUTO Notification Service: Production Grade
 * Handles event-driven notification dispatching based on roles and preferences.
 */
class NotificationService {
    constructor() {
        this.io = null;
    }

    /**
     * Set the Socket.io instance
     * @param {Object} io 
     */
    setIo(io) {
        this.io = io;
    }

    /**
     * Create a notification specifically for the Builder Dashboard
     * @param {Object} params - { recipientId, type, title, message, severity, projectId, referenceId, showPopup }
     */
    async createBuilderNotification({ recipientId, type, title, message, severity = 'medium', projectId = null, referenceId = null, showPopup = true }) {
        console.log(`[NotificationService] Creating builder notification: ${type} for user ${recipientId}`);
        try {
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            const priority = validPriorities.includes(severity) ? severity : (severity === 'critical' ? 'urgent' : 'medium');

            const notification = new Notification({
                recipient: recipientId,
                type,
                title,
                message,
                severity,
                priority,
                dashboard: 'BUILDER',
                projectId,
                referenceId,
                isRead: false,
                status: 'unread'
            });

            await notification.save();
            console.log(`💾 Builder Notification saved: ${notification._id} for user ${recipientId}`);

            if (this.io) {
                const room = recipientId.toString();
                console.log(`[NotificationService] Emitting 'builder-notification' to room: ${room}`);
                this.io.to(room).emit('builder-notification', {
                    ...notification.toObject(),
                    showPopup
                });
                console.log(`[NotificationService] Emit completed.`);
            } else {
                console.warn('[NotificationService] IO instance not initialized!');
            }

            return notification;
        } catch (err) {
            console.error(`❌ Error creating builder notification: ${err.message}`);
            throw err;
        }
    }

    /**
     * Mapping of events to roles that should be notified by default
     */
    EVENT_ROLE_MAP = {
        'hazard': ['admin', 'civil_engineer', 'safety_officer', 'builder'],
        'task_assigned': ['admin', 'project_site', 'civil_engineer', 'builder'],
        'task_updated': ['project_site', 'admin', 'builder', 'civil_engineer'],
        'site_log': ['admin', 'civil_engineer', 'builder'],
        'attendance': ['project_site', 'admin', 'builder'],
        'design_approval': ['admin', 'client', 'civil_engineer', 'builder'],
        'design_rejected': ['admin', 'client', 'civil_engineer', 'builder'],
        'budget_exceeded': ['client', 'admin', 'builder'],
        'milestone': ['client', 'admin', 'project_site', 'civil_engineer', 'builder'],
        'schedule_delay': ['client', 'admin', 'civil_engineer', 'builder'],
        'system': ['admin', 'builder', 'civil_engineer', 'client'],
        'user_created': ['admin']
    };

    /**
     * Trigger a notification event
     * @param {string} eventType - The type of event (e.g., 'hazard', 'milestone')
     * @param {Object} data - Contextual data (e.g., projectID, taskID, message override)
     */
    async triggerNotification(eventType, data) {
        try {
            console.log(`🔔 Notification Triggered: "${eventType}" (length: ${eventType.length})`);

            const rolesToNotify = this.EVENT_ROLE_MAP[eventType] || [];
            console.log(`👥 Roles to notify for "${eventType}": ${rolesToNotify.join(', ')}`);
            if (rolesToNotify.length === 0) {
                console.log(`⚠️ No roles found for event type: "${eventType}"`);
                return;
            }

            // Find all users with the relevant roles
            // We use a simpler case-insensitive match and remove status filter for diagnostic purposes
            const users = await User.find({
                role: {
                    $in: rolesToNotify.map(r => new RegExp(`^${r}$`, 'i'))
                }
            });

            if (users.length === 0) {
                console.log(`⚠️ No users found matching roles: ${rolesToNotify.join(', ')} for event: ${eventType}`);
                return;
            }

            console.log(`✅ Found ${users.length} users to notify: ${users.map(u => u.email).join(', ')}`);

            await this._processNotifications(users, eventType, data);
        } catch (err) {
            console.log(`❌ Notification Service Error: ${err.message}`);
        }
    }

    /**
     * Broadcast a notification to ALL active users
     */
    async broadcastNotification(data) {
        try {
            console.log(`📢 Broadcasting Notification: ${data.title}`);
            const users = await User.find({ status: 'Active' });
            await this._processNotifications(users, 'system', data);
        } catch (err) {
            console.log(`❌ Broadcast Error: ${err.message}`);
        }
    }

    async _processNotifications(users, eventType, data) {
        console.log(`📡 Processing notifications for ${users.length} users...`);
        for (const user of users) {
            // Check user preferences
            let setting = await NotificationSetting.findOne({ user: user._id });

            if (!setting) {
                console.log(`🛠️ Creating default settings for user: ${user.email}`);
                setting = await NotificationSetting.create({
                    user: user._id,
                    preferences: Object.keys(this.EVENT_ROLE_MAP).map(type => ({
                        eventType: type,
                        inApp: true,
                        email: true
                    }))
                });
            }

            const pref = setting.preferences.find(p => p.eventType === eventType);
            console.log(`👤 User: ${user.email} | Prefs for ${eventType}: ${pref ? JSON.stringify(pref) : 'NOT FOUND'}`);
            if (pref && !pref.inApp && !pref.email) {
                console.log(`🚫 User ${user.email} has both inApp and email disabled for ${eventType}`);
                continue;
            }

            const notificationPayload = {
                title: data.title || this._formatTitle(eventType),
                message: data.message || `An alert of type ${eventType} has occurred in the system.`,
                priority: data.priority || this._getPriority(eventType),
                metadata: data.metadata || {}
            };

            // Dispatch to all enabled channels in parallel
            const dispatchResults = await Promise.allSettled([
                this._dispatchInApp(user, eventType, notificationPayload, pref),
                this._dispatchEmail(user, eventType, notificationPayload, pref)
            ]);

            // Log or handle individual channel failures if needed
            const failedChannels = dispatchResults.filter(r => r.status === 'rejected');
            if (failedChannels.length > 0) {
                console.log(`[WARN] Some channels failed for user ${user.email}: ${failedChannels.map(f => f.reason).join(', ')}`);
            }
        }
    }

    async _dispatchInApp(user, eventType, payload, pref) {
        if (pref && !pref.inApp) {
            console.log(`📉 In-app notification disabled for user ${user.email}`);
            return null;
        }

        const notification = new Notification({
            recipient: user._id,
            ...payload,
            type: eventType,
            channelsSent: ['inApp']
        });

        await notification.save();
        console.log(`💾 Notification saved to DB for user ${user.email}: ${notification._id}`);

        if (this.io) {
            const room = user._id.toString();
            console.log(`📤 Emitting 'notification' to room: ${room}`);
            this.io.to(room).emit('notification', notification);
        } else {
            console.log(`⚠️ No socket.io instance found in NotificationService!`);
        }
        return 'inApp';
    }

    async _dispatchEmail(user, eventType, payload, pref) {
        if (!pref || !pref.email || !user.email) return null;

        const result = await emailService.sendEmail(
            user.email,
            `AI_AUTO ALERT: ${payload.title}`,
            payload.message,
            `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0047AB;">${payload.title}</h2>
                <p>${payload.message}</p>
                <hr />
                <small style="color: #666;">Priority: ${payload.priority.toUpperCase()} | Type: ${eventType}</small>
            </div>`
        );

        if (result.success) {
            await Notification.findOneAndUpdate(
                { recipient: user._id, type: eventType },
                { $addToSet: { channelsSent: 'email' } },
                { sort: { createdAt: -1 } }
            );
        }
        return 'email';
    }

    _formatTitle(eventType) {
        return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    _getPriority(eventType) {
        const urgentEvents = ['hazard', 'budget_exceeded', 'schedule_delay'];
        return urgentEvents.includes(eventType) ? 'high' : 'medium';
    }

    /**
     * Parse an Excel file and save notifications to the database
     * @param {string} filePath - Path to the uploaded Excel file
     */
    async processExcelUpload(filePath) {
        try {
            console.log(`📊 Processing Excel Upload: ${filePath}`);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const notifications = [];
            for (const row of data) {
                // Handle potential column name variations or trimming
                let email = row.email || row.Email || row.EMAIL;
                let description = row.description || row.Description || row.DESC || row.message || row.Message;
                let rawDate = row.reminderdate || row.reminderDate || row.ReminderDate ||
                    row['send date'] || row['Send Date'] || row['senddate'] ||
                    row['Reminder Date'] || row['REMINDER DATE'] || row.date || row.Date;
                let subject = row.subject || row.Subject || row.SUBJECT || 'Scheduled Notification';
                let whatsapp = row.whatsapp || row.WhatsApp || row.Whatsapp || row.WHATSAPP || row.phone || row.Phone;

                // RESILIENCE: If standard headers failed, look into __EMPTY keys (happens with some Excel formats)
                if (!email || !description || !rawDate) {
                    Object.keys(row).forEach(key => {
                        if (key.startsWith('__EMPTY')) {
                            const val = row[key];
                            if (!val) return;

                            // Check if it looks like an email
                            if (!email && typeof val === 'string' && val.includes('@') && val.includes('.')) {
                                email = val;
                            }
                            // Check if it looks like a date (number for Excel serial or date string)
                            else if (!rawDate && (typeof val === 'number' || (typeof val === 'string' && !isNaN(Date.parse(val))))) {
                                rawDate = val;
                            }
                            // If we have email and date but no description, take the first substantial string left
                            else if (!description && typeof val === 'string' && val.length > 5 && val !== email) {
                                description = val;
                            }
                            // Check for WhatsApp (digits only, at least 10 chars)
                            else if (!whatsapp && (typeof val === 'number' || (typeof val === 'string' && /^\d{10,}$/.test(val.replace(/\D/g, ''))))) {
                                whatsapp = val;
                            }
                        }
                    });
                }

                if (!email || !description || !rawDate) {
                    console.log('⚠️ Row skipped: missing required fields', {
                        email: !!email,
                        description: !!description,
                        rawDate: !!rawDate,
                        rowContent: row
                    });
                    continue;
                }

                // Excel date serial to JS Date conversion
                // Excel stores dates as days since 1900-01-01, offset 25569 from Unix epoch (1970-01-01)
                // We use local date to avoid timezone shifting the day
                let scheduledDate;
                if (typeof rawDate === 'number') {
                    // Convert Excel serial number to local midnight (not UTC)
                    // Excel serial: days since Jan 1, 1900 (with leap year bug)
                    // The +0.5 ensures we land at noon to avoid DST edge cases
                    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899 local
                    const msPerDay = 86400 * 1000;
                    scheduledDate = new Date(excelEpoch.getTime() + rawDate * msPerDay);
                    // Set to noon of that day to avoid timezone flipping the date
                    scheduledDate.setHours(12, 0, 0, 0);
                    console.log(`📅 Excel serial ${rawDate} → ${scheduledDate.toLocaleDateString()}`);
                } else if (typeof rawDate === 'string') {
                    scheduledDate = new Date(rawDate);
                } else {
                    scheduledDate = new Date(rawDate);
                }

                if (isNaN(scheduledDate.getTime())) {
                    console.log('⚠️ Row skipped: Invalid date format', { rawDate, email });
                    continue;
                }

                console.log(`📝 Scheduling: ${email} | Date: ${scheduledDate.toLocaleDateString()} | Subject: ${subject}`);

                notifications.push({
                    recipientEmail: email.trim(),
                    subject: subject.trim(),
                    description: description.trim(),
                    scheduledDate,
                    whatsappNumber: whatsapp ? String(whatsapp).trim() : null,
                    whatsappStatus: whatsapp ? 'PENDING' : 'SKIPPED',
                    status: 'PENDING'
                });
            }

            if (notifications.length > 0) {
                await ScheduledNotification.insertMany(notifications);
                console.log(`✅ Bulk uploaded ${notifications.length} notifications.`);
            }

            return { success: true, count: notifications.length };
        } catch (err) {
            console.error('❌ Excel Processing Error:', err.message);
            throw err;
        }
    }

    /**
     * Check for due scheduled notifications and send them
     */
    async checkAndSendScheduledNotifications() {
        try {
            const now = new Date();
            console.log(`🕒 Checking scheduled notifications at ${now.toISOString()}...`);

            const pending = await ScheduledNotification.find({
                status: 'PENDING',
                scheduledDate: { $lte: now }
            }).limit(50); // Process in batches

            if (pending.length === 0) {
                // Heartbeat log removed or kept minimal to avoid terminal noise
                // console.log(`🕒 Checked at ${now.toISOString()}: No pending notifications due.`);
                return;
            }

            console.log(`🚀 FOUND ${pending.length} notifications due for dispatch!`);

            for (const note of pending) {
                const result = await emailService.sendEmail(
                    note.recipientEmail,
                    note.subject,
                    note.description,
                    `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #0047AB;">${note.subject}</h2>
                        <p>${note.description}</p>
                        <hr />
                        <small style="color: #666;">This is an automated notification scheduled for ${note.scheduledDate.toLocaleString()}</small>
                    </div>`
                );

                if (result.success) {
                    note.status = 'SENT';
                } else {
                    note.status = 'FAILED';
                    note.errorLog = result.error;
                }
                await note.save();
            }
        } catch (err) {
            console.error('❌ Scheduled Dispatch Error:', err.message);
        }
    }
}

export default new NotificationService();
