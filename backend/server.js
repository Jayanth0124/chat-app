import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { handleSockets } from './sockets/socketHandler.js';
import Message from './models/Message.js';
import Broadcast from './models/Broadcast.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import callRoutes from './routes/calls.js';
import supportRoutes from './routes/support.js';
import cloudinary from './utils/cloudinary.js';

dotenv.config();

const frontendOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, '')
  : 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Middleware to attach Socket.io instance
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/support', supportRoutes);

app.get('/', (req, res) => {
  res.send('Chat App API is running...');
});

// Socket.io Centralized Logic
handleSockets(io);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, { 
  family: 4 // Forces IPv4 to bypass local network IPv6 DNS resolution issues
})
  .then(() => {
    console.log('Connected to MongoDB');

    // Drop problematic unique indexes on support tickets and bug reports if they exist
    mongoose.connection.once('open', async () => {
      try {
        const db = mongoose.connection.db;
        try {
          await db.collection('supporttickets').dropIndex('ticketId_1');
          console.log('[INDEX] Dropped unique index ticketId_1 on supporttickets');
        } catch (err) {
          // ignore index-not-found errors
        }
        try {
          await db.collection('bugreports').dropIndex('reportId_1');
          console.log('[INDEX] Dropped unique index reportId_1 on bugreports');
        } catch (err) {
          // ignore index-not-found errors
        }
      } catch (e) {
        console.error('Error dropping unique indexes:', e);
      }
    });

    // Periodic cleanup for expired messages and broadcasts (runs every 30 minutes)
    setInterval(async () => {
      try {
        const expiredMessages = await Message.find({ expiresAt: { $lte: new Date() } });
        
        let deletedCloudinaryAssets = 0;
        for (const msg of expiredMessages) {
          if (msg.mediaUrl && msg.mediaUrl.includes('cloudinary.com')) {
             try {
               const urlParts = msg.mediaUrl.split('/');
               const filename = urlParts[urlParts.length - 1];
               const publicId = filename.split('.')[0];
               
               // Attempt to destroy. If it fails, we still delete the message.
               const resourceType = msg.messageType === 'video' ? 'video' : (msg.messageType === 'document' ? 'raw' : 'image');
               await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
               deletedCloudinaryAssets++;
             } catch (e) {
               console.error('Failed to delete asset from Cloudinary:', e);
             }
          }
        }

        const deleted = await Message.deleteMany({ expiresAt: { $lte: new Date() } });
        if (deleted.deletedCount > 0) {
          console.log(`[PRUNING] Cleaned up ${deleted.deletedCount} expired messages and ${deletedCloudinaryAssets} Cloudinary assets.`);
        }

        const deletedBroadcasts = await Broadcast.deleteMany({ expiresAt: { $ne: null, $lte: new Date() } });
        if (deletedBroadcasts.deletedCount > 0) {
          console.log(`[PRUNING] Cleaned up ${deletedBroadcasts.deletedCount} expired broadcasts.`);
        }
      } catch (err) {
        console.error('Failed to run periodic pruning:', err);
      }
    }, 30 * 60 * 1000);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
