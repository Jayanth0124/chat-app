import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend/models/User.js';
import UsernameOwnership from './backend/models/UsernameOwnership.js';

dotenv.config();

const migrateUsernames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find();
    console.log(`Found ${users.length} users. Migrating usernames...`);

    let migratedCount = 0;

    for (const user of users) {
      // Migrate current username
      const existingCurrent = await UsernameOwnership.findOne({ username: user.username.toLowerCase() });
      if (!existingCurrent) {
        await UsernameOwnership.create({
          userId: user._id,
          username: user.username.toLowerCase(),
          acquiredAt: user.createdAt
        });
        migratedCount++;
      }

      // Migrate previous usernames
      if (user.previousUsernames && user.previousUsernames.length > 0) {
        for (const prev of user.previousUsernames) {
          const existingPrev = await UsernameOwnership.findOne({ username: prev.toLowerCase() });
          if (!existingPrev) {
            await UsernameOwnership.create({
              userId: user._id,
              username: prev.toLowerCase(),
              acquiredAt: user.createdAt // Approximation
            });
            migratedCount++;
          }
        }
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} usernames to the Ownership collection.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateUsernames();
