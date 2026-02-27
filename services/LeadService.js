import Lead from '../models/Lead.js';
import { calculateLeadScore } from '../utils/leadScoring.js';

class LeadService {
    /**
     * Processes time-decay for all leads.
     * Usually runs as a daily cron job.
     */
    async processTimeDecay(io = null) {
        console.log('📉 Processing Lead Time-Decay...');
        try {
            // Find all leads that haven't been updated recently or are not converted
            const activeLeads = await Lead.find({ status: { $ne: 'Converted' } });

            let updateCount = 0;
            for (const lead of activeLeads) {
                const oldTemp = lead.leadTemperature;
                const { score, temperature } = calculateLeadScore(lead);

                // Only save if something changed
                if (lead.leadScore !== score || lead.leadTemperature !== temperature) {
                    lead.leadScore = score;
                    lead.leadTemperature = temperature;
                    await lead.save();
                    updateCount++;

                    // Emit socket event if temp changed
                    if (io) {
                        io.emit('lead-updated', lead);
                        if (oldTemp !== 'Hot' && temperature === 'Hot') {
                            io.emit('lead-hot-alert', lead);
                        }
                    }
                }
            }
            console.log(`✅ Time-decay processed. Updated ${updateCount} leads.`);
        } catch (err) {
            console.error('❌ Error processing lead decay:', err);
        }
    }
}

export default new LeadService();
