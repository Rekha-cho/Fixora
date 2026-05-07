const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fixora';
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
        });

        console.log('✅ MongoDB Connected Successfully');
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);

        if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
            console.error('');
            console.error('💡 DNS SRV lookup failed. Try these fixes:');
            console.error('   1. Whitelist your IP in MongoDB Atlas → Network Access → Allow Access from Anywhere');
            console.error('   2. Change your DNS to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)');
            console.error('   3. Use the standard connection string (non-SRV) from Atlas');
            console.error('   4. If on college/office WiFi, try using mobile hotspot');
        }

        process.exit(1);
    }
};

module.exports = connectDB;