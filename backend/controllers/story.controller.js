import Story from "../models/Story.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";

// Create a new story
export const createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType, caption, textOverlay, privacy, allowedUsers } = req.body;
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
      $or: [
        { user: { $in: validUserIds } },
        { user: { $in: publicUserIds } }
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

    if (story.mediaUrl) {
      // Optional: Delete from cloudinary
      // const publicId = story.mediaUrl.split("/").pop().split(".")[0];
      // await cloudinary.uploader.destroy(publicId);
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
