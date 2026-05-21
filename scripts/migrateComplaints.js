// scripts/migrateComplaints.js
require('dotenv').config(); // load .env variables

const mongoose = require('mongoose');
const prisma = require('../config/prismaClient');
const Complaint = require('../models/Complaint'); // Mongoose model

// Connect to MongoDB using the same URI as the app uses
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixora';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  const mongoComplaints = await Complaint.find();
  console.log(`Found ${mongoComplaints.length} complaints in MongoDB`);

  let migrated = 0;
  for (const c of mongoComplaints) {
    // Use upsert to avoid duplicate rows if script runs multiple times
    await prisma.complaint.upsert({
      where: { id: c._id.toString() },
      update: {}, // no fields to update – we assume original data is correct
      create: {
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        category: c.category,
        studentName: c.studentName,
        studentId: c.studentId.toString(),
        status: c.status || 'Pending',
        priority: c.priority || 'Medium',
        imageUrl: c.imageUrl || '',
        adminRemark: c.adminRemark || '',
        // Prisma will auto‑populate createdAt / updatedAt if defined in schema
      },
    });
    migrated++;
  }

  console.log(`Migrated ${migrated} complaints to PostgreSQL.`);
  await prisma.$disconnect();
  await mongoose.disconnect();
  console.log('All connections closed.');
}

main()
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
