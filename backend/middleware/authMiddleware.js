const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');

// ─── PROTECT: Verify JWT Token ────────────────────────────────
// Use this on any route that requires the user to be logged in
const protect = async (req, res, next) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user to request
        req.user = await authRepository.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found. Token invalid.' });
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token. Please login.' });
    }
};

// ─── ADMIN ONLY: Role Guard ───────────────────────────────────
// Always use AFTER protect middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};

// ─── PHARMACIST ONLY: Role Guard ─────────────────────────────
const pharmacistOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'pharmacist' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Pharmacists only.' });
};

module.exports = { protect, adminOnly, pharmacistOnly };
