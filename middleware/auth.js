const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Request header se token lo
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // "Bearer <token>" se token nikalo
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. Invalid token format.' });
        }

        // Token verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fixora_secret_key');
        req.user = decoded;
        next(); // Aage jaane do

    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Sirf admin access kar sake
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };