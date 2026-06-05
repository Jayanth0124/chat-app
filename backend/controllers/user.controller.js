import User from '../models/User.js';
import cloudinary from '../utils/cloudinary.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // Don't fetch the current user and don't fetch banned users
    const filteredUsers = await User.find({ 
      _id: { $ne: loggedInUserId },
      status: { $ne: 'banned' } 
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, profilePic } = req.body;
    const userId = req.user._id;

    let updatedFields = {};
    if (displayName) updatedFields.displayName = displayName;
    if (bio) updatedFields.bio = bio;

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updatedFields, 
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changeUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const cleanUsername = username.toLowerCase().trim();

    const usernameRegex = /^[a-z0-9_.]+$/;
    if (cleanUsername.length < 4 || cleanUsername.length > 20 || !usernameRegex.test(cleanUsername)) {
      return res.status(400).json({ 
        message: "Username must be 4-20 characters and contain only lowercase letters, numbers, underscores, or dots." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.usernameChanges >= 3) {
      return res.status(400).json({ message: "Username can no longer be changed (limit of 3 reached)" });
    }

    if (cleanUsername === user.username) {
      return res.status(200).json(user);
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    user.previousUsernames.push(user.username);
    user.username = cleanUsername;
    user.usernameChanges += 1;
    await user.save();

    const updatedUser = await User.findById(userId).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in changeUsername:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
