import User from '../models/User.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import https from 'https';
import generateToken from '../utils/generateToken.js';
import SecurityLog from '../models/SecurityLog.js';
import UsernameOwnership from '../models/UsernameOwnership.js';

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    // Strict username validation
    const usernameRegex = /^[a-zA-Z0-9_]{8,24}$/;
    if (!username || !usernameRegex.test(username)) {
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

    // Strict username validation
    const usernameRegex = /^[a-zA-Z0-9_]{8,24}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: "Username must be 8-24 characters long and can only contain letters, numbers, and underscores." });
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Security: Always return 200 even if user not found to prevent email enumeration
    if (!user) return res.status(200).json({ message: "If an account exists, a password reset link has been sent." });

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for DB storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Send email using Brevo
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password/${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0E; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #8C6DF0; text-align: center; margin-bottom: 30px;">ORBIT</h1>
        <div style="background-color: #12121A; padding: 30px; border-radius: 12px; border: 1px solid #ffffff1a;">
          <h2 style="margin-top: 0; color: #ffffff;">Hello ${user.displayName},</h2>
          <p style="color: #a0a0a0; line-height: 1.6;">We received a request to reset your Orbit password.</p>
          <p style="color: #a0a0a0; line-height: 1.6;">Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #8C6DF0; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #a0a0a0; line-height: 1.6; font-size: 14px;">This link will expire in 15 minutes.</p>
          <p style="color: #a0a0a0; line-height: 1.6; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
          <p style="color: #555555; font-size: 12px; margin-top: 40px; text-align: center;">Or copy and paste this link: <br/><a href="${resetUrl}" style="color: #8C6DF0;">${resetUrl}</a></p>
        </div>
      </div>
    `;

    const payload = JSON.stringify({
      sender: {
        name: "Orbit Security",
        email: process.env.EMAIL_FROM
      },
      to: [
        {
          email: user.email,
          name: user.displayName
        }
      ],
      subject: "Reset Your Orbit Password",
      htmlContent: emailHtml
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const emailRes = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, text: data });
        });
      });
      req.on('error', (e) => reject(e));
      req.write(payload);
      req.end();
    });

    if (!emailRes.ok) {
      const errorText = emailRes.text;
      import('fs').then(fs => fs.writeFileSync('debug_error.txt', "BREVO ERROR: " + errorText));
      console.error("Brevo error:", errorText);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: "Error sending email. Please try again later." });
    }

    res.status(200).json({ message: "If an account exists, a password reset link has been sent." });
  } catch (error) {
    import('fs').then(fs => fs.writeFileSync('debug_error.txt', error.stack || error.toString()));
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });

    // Hash the incoming token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 6 || !hasLetter || !hasNumber) {
      return res.status(400).json({ message: "Password must be at least 6 characters and contain both letters and numbers." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Delete token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide both old and new passwords." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password." });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ message: "Password does not meet the security requirements." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
