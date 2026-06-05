import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';
import Snap from './models/Snap.js';

dotenv.config();

const clearAndSeedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('Connected to DB for clearing and seeding...');

    // Clear existing collections
    console.log('Clearing Users...');
    await User.deleteMany({});
    
    console.log('Clearing Chats...');
    await Chat.deleteMany({});
    
    console.log('Clearing Messages...');
    await Message.deleteMany({});
    
    console.log('Clearing Snaps...');
    await Snap.deleteMany({});

    // Attempt to drop AuditLog if it exists (or clear it if model loaded, but since it is not defined yet we can do it via mongoose.connection.db)
    try {
      await mongoose.connection.db.collection('auditlogs').deleteMany({});
      console.log('Clearing AuditLogs...');
    } catch (e) {
      console.log('AuditLogs collection does not exist or could not be cleared yet');
    }

    // Seed requested Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Jayanth@0124', salt);
    
    const admin = await User.create({
      username: 'admin0124',
      displayName: 'Administrator',
      email: 'jayanthdonavalli0124@gmail.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });
    
    console.log('Admin user seeded successfully:', admin.username);
    process.exit(0);
  } catch (err) {
    console.error('Clearing/Seeding error:', err);
    process.exit(1);
  }
};

clearAndSeedDB();
