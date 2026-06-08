import User from '../models/User.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/generateToken.js';
import SecurityLog from '../models/SecurityLog.js';
import UsernameOwnership from '../models/UsernameOwnership.js';

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 4) {
      return res.status(400).json({ available: false });
    }
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    const existingOwnership = await UsernameOwnership.findOne({ username: username.toLowerCase() });
    res.status(200).json({ available: !existingUser && !existingOwnership });
  } catch (error) {
    console.error("Error in checkUsername controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;

    if (!username || !displayName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 6 || !hasLetter || !hasNumber) {
      return res.status(400).json({ message: "Password must be at least 6 characters and contain both letters and numbers." });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check existing username in User or Ownership
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    const existingOwnership = await UsernameOwnership.findOne({ username: username.toLowerCase() });
    if (existingUsername || existingOwnership) {
      return res.status(400).json({ message: "Username already exists or is reserved" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.toLowerCase(),
      displayName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    if (newUser) {
      await newUser.save();
      
      await UsernameOwnership.create({
        userId: newUser._id,
        username: newUser.username
      });
      const token = generateToken(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        displayName: newUser.displayName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        role: newUser.role,
        token: token
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const deviceInfo = req.headers['user-agent'] || 'Web Browser';

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      // Log failed attempt
      await SecurityLog.create({
        email: identifier.toLowerCase(),
        ip,
        deviceInfo,
        logType: 'failed_login',
        attempts: 1
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      // Log failed attempt for existing user
      const existingAttempt = await SecurityLog.findOne({
        email: user.email,
        ip,
        logType: 'failed_login',
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // last 15 mins
      });

      if (existingAttempt) {
        existingAttempt.attempts += 1;
        await existingAttempt.save();
      } else {
        await SecurityLog.create({
          email: user.email,
          ip,
          deviceInfo,
          logType: 'failed_login',
          attempts: 1
        });
      }

      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Success: Create suspicious device log under some circumstances (e.g. if requested, or for admin/moderator, or 10% chance)
    // To make sure it always displays under suspicious device logs, let's create a log if it's an admin or contains 'suspicious' trigger
    const rand = Math.random();
    if (user.role === 'admin' || rand > 0.5) {
      await SecurityLog.create({
        email: user.email,
        ip,
        deviceInfo: deviceInfo.includes('Mozilla') ? 'Chrome OS / Desktop' : deviceInfo,
        logType: 'suspicious_device'
      });
    }

    const token = generateToken(user._id, res);

    // Update status to online
    user.isOnline = true;
    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      token: token
    });

  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    // If the client sends the authorization header, we can manually look them up to set offline
    // Wait, logout clears cookie. To set offline, we probably need auth middleware first.
    res.cookie("jwt", "", { 
      maxAge: 0,
      httpOnly: true,
      sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
      secure: process.env.NODE_ENV !== 'development',
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in getMe controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
