const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fixora_secret_key';

// Signup with bcrypt + MongoDB
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student'
        });

        res.status(201).json({
            message: 'Signup successful!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        next(error);
    }
});

// Login with bcrypt + JWT + session
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user._id,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        req.session.user = {
            id: user._id,
            name: user.name,
            role: user.role
        };

        res.cookie('fixora_token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
});

// Logout - session + cookie clear
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.clearCookie('fixora_token');
        res.json({ message: 'Logout successful' });
    });
});

// Create default admin one time
router.post('/create-admin', async (req, res, next) => {
    try {
        const existingAdmin = await User.findOne({ email: 'admin@fixora.com' });

        if (existingAdmin) {
            return res.json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        await User.create({
            name: 'Admin',
            email: 'admin@fixora.com',
            password: hashedPassword,
            role: 'admin'
        });

        res.status(201).json({
            message: 'Admin created successfully',
            email: 'admin@fixora.com',
            password: 'admin123'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;