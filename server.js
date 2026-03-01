const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files serve karo (public folder se)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/authroutes');
const complaintRoutes = require('./routes/complaintRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// File streaming se index.html serve karo
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'text/html');
    fileStream.pipe(res);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});