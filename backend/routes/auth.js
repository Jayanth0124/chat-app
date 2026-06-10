import express from 'express';
import { signup, login, logout, getMe, checkUsername, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/check-username', checkUsername);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', protectRoute, changePassword);
router.get('/me', protectRoute, getMe);

export default router;
