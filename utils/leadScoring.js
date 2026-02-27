/**
 * HubSpot-Style Lead Scoring Engine
 */

// --- SCORING CONSTANTS ---
const SCORE_WEIGHTS = {
    // Behavioral (Highest weight)
    DEMO_REQUESTED: 50,
    MEETING_BOOKED: 50,
    CONTACT_SALES: 50,
    CONTACT_FORM_SUBMITTED: 30,
    PRICING_PAGE_VISIT: 20,
    WEBSITE_VISIT: 5,
    EMAIL_OPEN: 10,
    LINK_CLICK: 15,

    // Profile Fit
    INDUSTRY_MATCH: 15,
    COMPANY_SIZE_MATCH: 10,
    VERIFIED_IDENTITY: 10,

    // Negative Signals
    UNSUBSCRIBED: -100, // Effectively disqualifies
};

const THRESHOLDS = {
    HOT: 70,
    WARM: 40,
    COLD: 0
};

const DECAY_CONFIG = {
    THRESHOLD_DAYS: 30,
    WEEKLY_DECAY: 5
};

/**
 * Calculates a comprehensive leadScore based on behavioral and profile signals.
 * @param {Object} lead - The lead document
 * @returns {Object} - { score, temperature }
 */
export const calculateLeadScore = (lead) => {
    // 1. Analytics Safety: Skip simulated leads for business metrics if needed
    // (We still score them if requested, but routes filter them from reports)

    let score = 0;

    // --- AUTO-HOT OVERRIDE RULES (VERY IMPORTANT) ---
    const signals = lead.engagementSignals || [];
    const hasHighIntentSignal = signals.some(s =>
        ['demo_requested', 'meeting_booked', 'contact_sales'].includes(s.type)
    );

    if (hasHighIntentSignal) {
        return { score: 100, temperature: 'Hot' };
    }

    // --- BEHAVIORAL SCORING ---
    signals.forEach(signal => {
        switch (signal.type) {
            case 'contact_form': score += SCORE_WEIGHTS.CONTACT_FORM_SUBMITTED; break;
            case 'pricing_page': score += SCORE_WEIGHTS.PRICING_PAGE_VISIT; break;
            case 'website_visit': score += SCORE_WEIGHTS.WEBSITE_VISIT; break;
            case 'email_open': score += SCORE_WEIGHTS.EMAIL_OPEN; break;
            case 'link_click': score += SCORE_WEIGHTS.LINK_CLICK; break;
            case 'unsubscribe': score += SCORE_WEIGHTS.UNSUBSCRIBED; break;
        }
    });

    // --- PROFILE FIT SCORING ---
    if (lead.industryMatch) score += SCORE_WEIGHTS.INDUSTRY_MATCH;
    if (lead.companySizeMatch) score += SCORE_WEIGHTS.COMPANY_SIZE_MATCH;
    if (lead.isEmailVerified || lead.isPhoneVerified) score += SCORE_WEIGHTS.VERIFIED_IDENTITY;

    // --- APPLY TIME DECAY ---
    score = applyTimeDecay(lead, score);

    // --- TEMPERATURE CLASSIFICATION ---
    let temperature = 'Cold';
    if (score >= THRESHOLDS.HOT) {
        temperature = 'Hot';
    } else if (score >= THRESHOLDS.WARM) {
        temperature = 'Warm';
    }

    // Ensure score doesn't go below 0
    return { score: Math.max(0, score), temperature };
};

/**
 * Automatically reduces score if no activity for 30+ days.
 */
export const applyTimeDecay = (lead, currentScore) => {
    if (!lead.lastEngagementAt) return currentScore;

    const lastEngagement = new Date(lead.lastEngagementAt);
    const now = new Date();
    const daysSinceEngagement = Math.floor((now - lastEngagement) / (1000 * 60 * 60 * 24));

    if (daysSinceEngagement >= DECAY_CONFIG.THRESHOLD_DAYS) {
        const weeksLate = Math.floor((daysSinceEngagement - DECAY_CONFIG.THRESHOLD_DAYS) / 7);
        const decay = (weeksLate + 1) * DECAY_CONFIG.WEEKLY_DECAY;
        return currentScore - decay;
    }

    return currentScore;
};
