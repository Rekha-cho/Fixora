const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const usersFile = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'fixora_secret_key';

function getUsers() {
    if (!fs.existsSync(usersFile)) return [];
    const data = fs.readFileSync(usersFile, 'utf8').replace(/^\uFEFF/, '');
    if (!data.trim()) return [];
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

// Signup
router.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }
    const users = getUsers();
    const exists = users.find(u => u.email === email);
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const newUser = {
        id: Date.now().toString(),
        name, email, password,
        role: 'student'
    };
    users.push(newUser);
    saveUsers(users);
    res.status(201).json({ message: 'Signup successful!', user: { name, email } });
});

// Login — JWT token generate hoga
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // JWT Token banao
    const token = jwt.sign(
        { id: user.id, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        message: 'Login successful!',
        token: token,
        user: { id: user.id, name: user.name, role: user.role }
    });
});

module.exports = router;