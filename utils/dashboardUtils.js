import User from '../models/User.js';
import Project from '../models/Project.js';
import Lead from '../models/Lead.js';

export const getDashboardStats = async () => {
    const [totalUsers, activeProjects, leads] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments({ status: 'In Progress' }),
        Lead.find({ isSimulated: { $ne: true } })
    ]);

    const distribution = {
        Hot: leads.filter(l => l.status === 'Hot').length,
        Warm: leads.filter(l => l.status === 'Warm').length,
        Cold: leads.filter(l => l.status === 'Cold').length
    };

    // Mock site visits and projected revenue based on leads for now
    const siteVisits = leads.filter(l => l.status === 'Warm').length;
    const projectedRevenue = distribution.Hot * 50000;

    return {
        totalUsers,
        activeProjects,
        totalLeads: leads.length,
        siteVisits,
        projectedRevenue: `$${(projectedRevenue / 1000).toFixed(1)}k`,
        distribution
    };
};
