const express = require('express');
const router = express.Router();

const Complaint = require('../models/Complaint');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST - create complaint
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { title, description, category, studentName, priority } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const newComplaint = await Complaint.create({
            title,
            description,
            category,
            studentName: studentName || req.user.name || 'Anonymous',
            studentId: req.user.id,
            priority: priority || 'Medium'
        });

        const io = req.app.get('io');
        io.emit('complaintCreated', newComplaint);

        res.status(201).json({
            message: 'Complaint submitted!',
            complaint: newComplaint
        });

    } catch (error) {
        next(error);
    }
});

// GET all complaints
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        let complaints;

        if (req.user.role && req.user.role.toLowerCase() === 'admin') {
            complaints = await Complaint.find().sort({ createdAt: -1 });
        } else {
            complaints = await Complaint.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        }

        res.json(complaints);

    } catch (error) {
        next(error);
    }
});

// GET complaint by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (
            req.user.role && req.user.role.toLowerCase() !== 'admin' &&
            complaint.studentId.toString() !== req.user.id
        ) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(complaint);

    } catch (error) {
        next(error);
    }
});

// PATCH status - admin only
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { status, adminRemark } = req.body;

        const validStatuses = ['Pending', 'In Progress', 'Resolved'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminRemark: adminRemark || ''
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const io = req.app.get('io');
        io.emit('complaintUpdated', complaint);

        res.json({
            message: 'Status updated!',
            complaint
        });

    } catch (error) {
        next(error);
    }
});

// DELETE complaint - admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const io = req.app.get('io');
        io.emit('complaintDeleted', req.params.id);

        res.json({ message: 'Complaint deleted successfully' });

    } catch (error) {
        next(error);
    }
});

module.exports = router;