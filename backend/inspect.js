import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Chat from './models/Chat.js';

dotenv.config();

const inspect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('Connected to DB...');

    const users = await User.find({});
    console.log('\n--- USERS ---');
    for (const u of users) {
      console.log(`User: ${u.username} (${u._id})`);
      console.log(`  Friends: [${u.friends.map(id => id.toString()).join(', ')}]`);
      console.log(`  Friend Requests: [${u.friendRequests.map(id => id.toString()).join(', ')}]`);
      console.log(`  Sent Requests: [${u.sentRequests.map(id => id.toString()).join(', ')}]`);
      console.log(`  Blocked Users: [${u.blockedUsers.map(id => id.toString()).join(', ')}]`);
    }

    const chats = await Chat.find({});
    console.log('\n--- CHATS ---');
    for (const c of chats) {
      console.log(`Chat: ${c._id} (isGroup: ${c.isGroupChat}, name: ${c.groupName})`);
      console.log(`  Participants: [${c.participants.map(id => id.toString()).join(', ')}]`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
