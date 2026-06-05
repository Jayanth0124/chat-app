import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { handleSockets } from './sockets/socketHandler.js';
import Message from './models/Message.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import callRoutes from './routes/calls.js';

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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

    // Periodic cleanup for expired messages (runs every 30 minutes)
    setInterval(async () => {
      try {
        const deleted = await Message.deleteMany({ expiresAt: { $lte: new Date() } });
        if (deleted.deletedCount > 0) {
          console.log(`[PRUNING] Cleaned up ${deleted.deletedCount} expired messages.`);
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
