const express = require('express');
const router = express.Router();

const prisma = require('../config/prismaClient');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
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

        // Save Feedback to Relational SQL DB via Prisma
        const feedback = await prisma.feedback.create({
            data: {
                complaintId,
                studentId: req.user.id,
                rating: parseInt(rating, 10),
                comment: comment || ''
            }
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
        // Fetch from SQL relational DB using Prisma
        const feedbacks = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Custom Cross-Database join: Populate complaint and user details from MongoDB
        const populatedFeedbacks = await Promise.all(feedbacks.map(async (fb) => {
            const complaint = await Complaint.findById(fb.complaintId).lean();
            const student = await User.findById(fb.studentId).select('name email').lean();
            return {
                ...fb,
                complaintId: complaint || { title: 'Unknown Complaint' },
                studentId: student || { name: 'Anonymous Student', email: '' }
            };
        }));

        res.json(populatedFeedbacks);
    } catch (error) {
        next(error);
    }
});

module.exports = router;