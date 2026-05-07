require('dotenv').config();

const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connect
connectDB();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies + sessions
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fixora_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Application-level middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/authroutes');
const complaintRoutes = require('./routes/complaintRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/feedback', feedbackRoutes);

// Simple View Routes
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/admin', (req, res) => res.render('admin'));
app.get('/profile', (req, res) => res.render('profile'));
app.get('/analytics', (req, res) => res.render('analytics'));
app.get('/my-complaints', (req, res) => res.render('my-complaints'));
app.get('/complaint-details', (req, res) => res.render('complaint-details'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const server = http.createServer(app);

// Socket.io setup
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('🔴 User disconnected:', socket.id);
    });
});

// io ko routes me use karne ke liye
app.set('io', io);

server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});