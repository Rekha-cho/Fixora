const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixora';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    const email = 'admin@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found.`);
    } else {
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`User ${email} promoted to admin.`);
      } else {
        console.log(`User ${email} is already admin.`);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
