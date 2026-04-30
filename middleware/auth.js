const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fixora_secret_key';

const authMiddleware = (req, res, next) => {
    try {
        let token;

        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // Cookie se bhi token check
        if (!token && req.cookies && req.cookies.fixora_token) {
            token = req.cookies.fixora_token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next();
};

module.exports = { authMiddleware, adminMiddleware };