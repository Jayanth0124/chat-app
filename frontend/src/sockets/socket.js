import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000' 
    : 'https://chat-app-t2pz.onrender.com');

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
});
