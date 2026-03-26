import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio');
    console.log(`[DB SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    
    // Log user count to verify database connection works for collections
    const userCount = await User.countDocuments();
    console.log(`[DB SUCCESS] Users in database: ${userCount}`);
  } catch (error) {
    console.error(`[DB ERROR] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
