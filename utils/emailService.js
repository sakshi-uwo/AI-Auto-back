import { Resend } from 'resend';

/**
 * Production-ready email service using Resend API
 */
class EmailService {
    constructor() {
        this.resend = null;
    }

    _init() {
        if (!this.resend && process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
        }
        return this.resend;
    }

    /**
     * Send an email
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} text - Plain text body
     * @param {string} html - HTML body (optional)
     */
    async sendEmail(to, subject, text, html) {
        try {
            const client = this._init();
            if (!client) {
                console.warn('[EMAIL] Resend API key missing. Skipping email dispatch.');
                return { success: false, error: 'API Key missing' };
            }

            // Note: In free tier, you can only send to your own email unless you verify a domain.
            const fromAddress = process.env.EMAIL || 'onboarding@resend.dev';

            const { data, error } = await client.emails.send({
                from: `AI_AUTO <${fromAddress.trim()}>`,
                to: [to],
                subject,
                text,
                html
            });

            if (error) {
                console.error(`[EMAIL] Resend Error for ${to}:`, error.message);
                return { success: false, error: error.message };
            }

            console.log(`[EMAIL] Message queued via Resend: ${data.id}`);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error(`[EMAIL] Critical failure sending to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();