import SystemSettings from '../models/SystemSettings.js';

/**
 * Middleware to intercept requests during maintenance mode.
 * Allows Admins through, but blocks all other roles.
 */
const maintenanceMiddleware = async (req, res, next) => {
    try {
        const settings = await SystemSettings.findOne();

        if (settings && settings.maintenanceMode) {
            // Check if the user is an admin
            // Authenticated user role is typically in req.user.role (from auth middleware)
            // or x-user-role header for simplicity in some mock parts of this app
            const userRole = req.headers['x-user-role'] || (req.user && req.user.role);

            if (userRole?.toLowerCase() !== 'admin') {
                return res.status(503).json({
                    maintenance: true,
                    message: settings.maintenanceNotice || "System is under maintenance. Please try again later.",
                    retryAfter: settings.maintenanceWindow?.endTime || null
                });
            }
        }

        next();
    } catch (err) {
        console.error("Maintenance Middleware Error:", err);
        next(); // Proceed if we can't check settings
    }
};

export default maintenanceMiddleware;
