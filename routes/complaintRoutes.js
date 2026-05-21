// routes/complaintRoutes.js (updated)
const express = require('express');
const router = express.Router();

const Complaint = require('../models/Complaint');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/multer');
const { uploadImage } = require('../config/cloudinary');
const complaintService = require('../services/complaintService'); // NEW SERVICE

// POST - create complaint (dual write)
router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, category, studentName, priority } = req.body;

    if (!title || !description || !category) {
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ message: 'All fields required' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file.path);
    }

    const complaintData = {
      title,
      description,
      category,
      studentName: studentName || req.user.name || 'Anonymous',
      studentId: req.user.id,
      priority: priority || 'Medium',
      imageUrl,
    };

    // Use the service to write to both DBs
    const { mongo: newComplaint } = await complaintService.createComplaint(complaintData);

    const io = req.app.get('io');
    io.emit('complaintCreated', newComplaint);

    res.status(201).json({
      message: 'Complaint submitted!',
      complaint: newComplaint,
    });
  } catch (error) {
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

// GET all complaints (still using Mongo for read; optional switch to service later)
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

// GET complaint by ID (still Mongo)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (req.user.role && req.user.role.toLowerCase() !== 'admin' && complaint.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(complaint);
  } catch (error) {
    next(error);
  }
});

// PATCH status - admin only (dual write)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { status, adminRemark } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    // Service updates both stores
    const updatedMongo = await complaintService.updateComplaintStatus(req.params.id, status, adminRemark || '');
    const io = req.app.get('io');
    io.emit('complaintUpdated', updatedMongo);
    res.json({
      message: 'Status updated!',
      complaint: updatedMongo,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE complaint - admin only (dual write)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    await complaintService.deleteComplaint(req.params.id);
    const io = req.app.get('io');
    io.emit('complaintDeleted', req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;