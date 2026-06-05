import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { handleSockets } from './sockets/socketHandler.js';
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
    origin: frontendOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));
app.use(express.json());
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
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
