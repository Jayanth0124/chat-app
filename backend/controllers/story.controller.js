import Story from "../models/Story.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";

// Create a new story
export const createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType, caption, textOverlay, privacy, allowedUsers, showBadge } = req.body;
    const userId = req.user._id;

    if (!mediaUrl && mediaType !== 'text') {
      return res.status(400).json({ message: "Media is required for image/video stories" });
    }

    let secureMediaUrl = null;
    if (mediaUrl && mediaUrl.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(mediaUrl, {
        resource_type: "auto",
        folder: "orbit_stories",
        quality: "auto:good",
        fetch_format: "auto"
      });
      secureMediaUrl = uploadResponse.secure_url;
    } else {
      secureMediaUrl = mediaUrl;
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newStory = new Story({
      user: userId,
      mediaUrl: secureMediaUrl,
      mediaType: mediaType || 'text',
      caption,
      textOverlay,
      privacy: privacy || 'everyone',
      showBadge: showBadge !== undefined ? showBadge : true,
      allowedUsers: allowedUsers || [],
      expiresAt
    });

    await newStory.save();
    
    await newStory.populate("user", "displayName profilePic _id");

    // Emit socket event
    const user = await User.findById(userId).populate("friends");
    if (req.io) {
      if (user.privacySettings?.accountPrivacy === 'private') {
        // Emit only to friends
        user.friends.forEach((friend) => {
          req.io.to(friend._id.toString()).emit("newStory", newStory);
        });
      } else {
        // Broadcast to everyone (simplified for Orbit)
        req.io.emit("newStory", newStory);
      }
      // Emit to self
      req.io.to(userId.toString()).emit("newStory", newStory);
    }

    res.status(201).json(newStory);
  } catch (error) {
    console.error("Error in createStory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get feed of stories for the current user
export const getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Find all users who are public, OR are friends with the current user, OR self
    const validUserIds = [...user.friends, userId];
    
    // Get all public users to show their stories
    const publicUsers = await User.find({ "privacySettings.accountPrivacy": { $ne: "private" } }).select('_id');
    const publicUserIds = publicUsers.map(u => u._id);

    const stories = await Story.find({
      $and: [
        {
          $or: [
            { user: { $in: validUserIds } },
            { user: { $in: publicUserIds } }
          ]
        },
        {
          $or: [
            { privacy: { $ne: 'custom' } },
            { privacy: 'custom', allowedUsers: userId },
            { user: userId }
          ]
        }
      ],
      expiresAt: { $gt: new Date() },
      isArchived: false
    })
    .populate("user", "displayName profilePic _id")
    .populate("views.user", "displayName profilePic _id")
    .sort({ createdAt: -1 });

    res.status(200).json(stories);
  } catch (error) {
    console.error("Error in getStories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark a story as viewed
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    let story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Do not count the owner's own view
    if (story.user.toString() === userId.toString()) {
      return res.status(200).json({ success: true, story });
    }

    // Try to atomically update an existing view
    let updatedStory = await Story.findOneAndUpdate(
      { _id: storyId, "views.user": userId },
      { 
        $set: { "views.$.lastViewedAt": new Date() },
        $inc: { "views.$.viewCount": 1 }
      },
      { new: true }
    );

    if (!updatedStory) {
      // If it wasn't updated, the view doesn't exist yet, so we atomically push it
      updatedStory = await Story.findOneAndUpdate(
        { _id: storyId, "views.user": { $ne: userId } },
        {
          $push: {
            views: {
              user: userId,
              firstViewedAt: new Date(),
              lastViewedAt: new Date(),
              viewCount: 1
            }
          }
        },
        { new: true }
      );
    }

    if (!updatedStory) {
      // Very rare case where the story was deleted mid-request
      return res.status(404).json({ message: "Story not found or concurrency issue" });
    }

    story = updatedStory;

    // Populate and emit full story update
    await story.populate("user", "displayName profilePic _id");
    await story.populate("views.user", "displayName profilePic _id");
    
    const ownerId = story.user._id ? story.user._id.toString() : story.user.toString();
    if (req.io && ownerId !== userId.toString()) {
       req.io.to(ownerId).emit("storyUpdated", story);
    }

    res.status(200).json({ success: true, story });
  } catch (error) {
    console.error("Error in viewStory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// React to a story
export const reactToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const existingReactionIndex = story.reactions.findIndex(r => r.user.toString() === userId.toString() && r.emoji === emoji);

    if (existingReactionIndex !== -1) {
      // Toggle OFF: Remove reaction
      story.reactions.splice(existingReactionIndex, 1);
    } else {
      // Toggle ON: Add reaction
      story.reactions.push({ user: userId, emoji });
    }
    
    await story.save();

    await story.populate("user", "displayName profilePic _id");
    await story.populate("views.user", "displayName profilePic _id");

    if (req.io && story.user.toString() !== userId.toString()) {
      // Emit full story updated
      req.io.to(story.user._id.toString()).emit("storyUpdated", story);
    }

    res.status(200).json({ success: true, story });
  } catch (error) {
    console.error("Error in reactToStory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a story
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findOne({ _id: storyId, user: userId });
    if (!story) {
      return res.status(404).json({ message: "Story not found or unauthorized" });
    }

    if (story.mediaUrl && story.mediaUrl.includes('cloudinary.com')) {
      try {
        const urlParts = story.mediaUrl.split('/upload/');
        if (urlParts.length > 1) {
          const afterUpload = urlParts[1].split('/');
          if (afterUpload[0].startsWith('v') && !isNaN(afterUpload[0].substring(1))) {
            afterUpload.shift();
          }
          const publicId = afterUpload.join('/').split('.')[0];
          const resourceType = story.mediaType === 'video' ? 'video' : 'image';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        }
      } catch (e) {
        console.error('Failed to delete story asset from Cloudinary:', e);
      }
    }
    // Use exact match deletion by storyId and userId to prevent accidental cascade deletions
    await Story.deleteOne({ _id: storyId, user: userId });

    if (req.io) {
      // notify friends
      const user = await User.findById(userId).populate("friends");
      user.friends.forEach((friend) => {
        req.io.to(friend._id.toString()).emit("storyDeleted", { storyId, userId });
      });
    }

    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Error in deleteStory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get stats for the current user
export const getStoryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all stories for the user (including archived/expired ones if they exist in DB)
    const allStories = await Story.find({ user: userId }).sort({ createdAt: 1 });

    let totalStories = allStories.length;
    let totalStoryViews = 0;
    
    // Time bounds
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let storiesThisWeek = 0;
    let storiesThisMonth = 0;
    
    // Streak tracking
    let currentStreak = 0;
    let longestStreak = 0;
    let lastStoryDateStr = null;

    // Iterate chronologically to calculate streaks and other stats
    allStories.forEach(story => {
      // Views
      if (story.views) {
        totalStoryViews += story.views.length;
      }

      // Time filters
      const storyDate = new Date(story.createdAt);
      if (storyDate >= oneWeekAgo) storiesThisWeek++;
      if (storyDate >= oneMonthAgo) storiesThisMonth++;

      // Streak logic (group by calendar day string: YYYY-MM-DD)
      const dateStr = storyDate.toISOString().split('T')[0];
      
      if (!lastStoryDateStr) {
        currentStreak = 1;
        longestStreak = 1;
        lastStoryDateStr = dateStr;
      } else if (dateStr !== lastStoryDateStr) {
        // Parse dates to check consecutive days
        const lastDate = new Date(lastStoryDateStr);
        const currDate = new Date(dateStr);
        const diffTime = Math.abs(currDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          // Consecutive day
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak = 1;
        }
        lastStoryDateStr = dateStr;
      }
    });

    // Check if the current streak is dead (no stories today or yesterday)
    if (lastStoryDateStr) {
      const lastDate = new Date(lastStoryDateStr);
      const diffTime = Math.abs(now - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // If it's been > 2 days since last story, streak is broken for "current"
      if (diffDays > 2) {
        currentStreak = 0;
      }
    }

    res.status(200).json({
      totalStories,
      totalStoryViews,
      currentStreak,
      longestStreak,
      storiesThisMonth,
      storiesThisWeek
    });

  } catch (error) {
    console.error("Error in getStoryStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStoryPrivacy = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { privacy, allowedUsers, showBadge } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Only owner can update privacy
    if (story.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this story" });
    }

    story.privacy = privacy || story.privacy;
    if (allowedUsers !== undefined) story.allowedUsers = allowedUsers;
    if (showBadge !== undefined) story.showBadge = showBadge;

    await story.save();
    
    // Populate user to return the full story object similar to what the frontend expects
    await story.populate("user", "username displayName profilePic");

    // Emit event to update live clients
    const io = req.app.get("io");
    if (io) {
      io.emit("storyUpdated", story);
    }

    res.status(200).json(story);
  } catch (error) {
    console.error("Error in updateStoryPrivacy:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
