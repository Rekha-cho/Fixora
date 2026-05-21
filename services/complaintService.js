// services/complaintService.js
const Complaint = require('../models/Complaint'); // Mongoose model
const prisma = require('../config/prismaClient'); // Prisma client

/**
 * Create a complaint in both MongoDB and PostgreSQL.
 * Returns an object containing both representations.
 */
async function createComplaint(data) {
  // Save to MongoDB first
  const mongoComplaint = await Complaint.create(data);

  // Map fields for Prisma (MongoDB _id is a string, use it as reference)
  const prismaData = {
    id: mongoComplaint._id.toString(),
    title: data.title,
    description: data.description,
    category: data.category,
    studentName: data.studentName,
    studentId: data.studentId,
    status: data.status || 'Pending',
    priority: data.priority || 'Medium',
    imageUrl: data.imageUrl || '',
    adminRemark: data.adminRemark || ''
  };
  await prisma.complaint.create({ data: prismaData });
  return { mongo: mongoComplaint, prisma: prismaData };
}

/** Retrieve all complaints visible to the requester */
async function getAllComplaints(user) {
  if (user.role && user.role.toLowerCase() === 'admin') {
    // Admin sees everything
    const [mongoList, prismaList] = await Promise.all([
      Complaint.find().sort({ createdAt: -1 }),
      prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } })
    ]);
    return { mongo: mongoList, prisma: prismaList };
  }
  // Student sees own complaints only
  const [mongoList, prismaList] = await Promise.all([
    Complaint.find({ studentId: user.id }).sort({ createdAt: -1 }),
    prisma.complaint.findMany({ where: { studentId: user.id }, orderBy: { createdAt: 'desc' } })
  ]);
  return { mongo: mongoList, prisma: prismaList };
}

/** Retrieve single complaint by its MongoDB ID */
async function getComplaintById(id, user) {
  const mongoComplaint = await Complaint.findById(id);
  if (!mongoComplaint) return null;
  // Authorization check (same logic as routes)
  if (user.role?.toLowerCase() !== 'admin' && mongoComplaint.studentId.toString() !== user.id) {
    return null;
  }
  const prismaComplaint = await prisma.complaint.findUnique({ where: { id: mongoComplaint._id.toString() } });
  return { mongo: mongoComplaint, prisma: prismaComplaint };
}

/** Update status (admin only) */
async function updateComplaintStatus(id, status, adminRemark = '') {
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');
  // Update MongoDB
  const mongoComplaint = await Complaint.findByIdAndUpdate(
    id,
    { status, adminRemark },
    { new: true }
  );
  // Update PostgreSQL using the same id (Mongo _id as primary key)
  await prisma.complaint.update({
    where: { id: id.toString() },
    data: { status, adminRemark }
  });
  return mongoComplaint;
}

/** Delete complaint (admin only) */
async function deleteComplaint(id) {
  await Complaint.findByIdAndDelete(id);
  await prisma.complaint.delete({ where: { id: id.toString() } });
  return true;
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint
};
