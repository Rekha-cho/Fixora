const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const complaintsFile = path.join(__dirname, '../data/complaints.json');

function getComplaints() {
    if (!fs.existsSync(complaintsFile)) {
        fs.writeFileSync(complaintsFile, '[]', 'utf8');
        return [];
    }
    const data = fs.readFileSync(complaintsFile, 'utf8').replace(/^\uFEFF/, ''); // BOM remove
    if (!data.trim()) return [];
    return JSON.parse(data);
}

function saveComplaints(complaints) {
    fs.writeFileSync(complaintsFile, JSON.stringify(complaints, null, 2), 'utf8');
}

router.post('/', (req, res) => {
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

router.get('/', (req, res) => {
    const complaints = getComplaints();
    res.json(complaints);
});

router.get('/:id', (req, res) => {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
});

router.patch('/:id/status', (req, res) => {
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