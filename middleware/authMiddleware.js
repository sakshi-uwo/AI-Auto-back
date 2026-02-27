import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verification of JWT token
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (excluding password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.warn('⚠️  Auth: JWT expired');
                return res.status(401).json({ error: 'Token expired', expired: true });
            }
            console.error('❌ Auth Middleware Error:', error.message);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

/**
 * Authorize roles - Grant access based on specific roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        // Case-insensitive role check (handles 'Admin', 'admin', 'ADMIN')
        const userRole = req.user?.role?.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
