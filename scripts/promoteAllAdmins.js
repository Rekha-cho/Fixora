const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixora';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update all users whose email contains 'admin' to be an admin
    const result = await User.updateMany(
      { email: { $regex: 'admin', $options: 'i' } },
      { $set: { role: 'admin' } }
    );
    
    console.log(`Updated ${result.modifiedCount} users to admin role.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
