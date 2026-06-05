import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const user = await User.findOneAndUpdate(
      { username: 'admin' },
      { role: 'admin' },
      { new: true }
    );
    console.log('Fixed admin user:', user);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixAdmin();
