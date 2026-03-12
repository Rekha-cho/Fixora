const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth'); // ← Yeh add kiya

const complaintsFile = path.join(__dirname, '../data/complaints.json');

function getComplaints() {
    if (!fs.existsSync(complaintsFile)) {
        fs.writeFileSync(complaintsFile, '[]', 'utf8');
        return [];
    }
    const data = fs.readFileSync(complaintsFile, 'utf8').replace(/^\uFEFF/, '');
    if (!data.trim()) return [];
    return JSON.parse(data);
}

function saveComplaints(complaints) {
    fs.writeFileSync(complaintsFile, JSON.stringify(complaints, null, 2), 'utf8');
}

// POST - authMiddleware protect kar raha hai ✅
router.post('/', authMiddleware, (req, res) => {
    const { title, description, category, studentName } = req.body;
    if (!title || !description || !category) {
        return res.status(400).json({ message: 'All fields required' });
    }
    const complaints = getComplaints();
    const newComplaint = {
        id: Date.now().toString(),
        title, description, category,
        studentName: studentName || 'Anonymous',
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    complaints.push(newComplaint);
    saveComplaints(complaints);
    res.status(201).json({ message: 'Complaint submitted!', complaint: newComplaint });
});

// GET all - authMiddleware protect kar raha hai ✅
router.get('/', authMiddleware, (req, res) => {
    const complaints = getComplaints();
    res.json(complaints);
});

// GET by ID - authMiddleware protect kar raha hai ✅
router.get('/:id', authMiddleware, (req, res) => {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
});

// PATCH status - authMiddleware protect kar raha hai ✅
router.patch('/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    const complaints = getComplaints();
    const idx = complaints.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    complaints[idx].status = status;
    saveComplaints(complaints);
    res.json({ message: 'Status updated!', complaint: complaints[idx] });
});

module.exports = router;