const express = require('express');
const router = express.Router();

const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { complaintId, rating, comment } = req.body;

        if (!complaintId || !rating) {
            return res.status(400).json({ message: 'Complaint ID and rating required' });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'Resolved') {
            return res.status(400).json({ message: 'Feedback can be given only after complaint is resolved' });
        }

        const feedback = await Feedback.create({
            complaintId,
            studentId: req.user.id,
            rating,
            comment
        });

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedback
        });

    } catch (error) {
        next(error);
    }
});

router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('complaintId')
            .populate('studentId', 'name email');

        res.json(feedbacks);
    } catch (error) {
        next(error);
    }
});

module.exports = router;