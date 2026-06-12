import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: false,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    textOverlay: {
      type: String,
      default: "",
    },
    privacy: {
      type: String,
      enum: ["everyone", "contacts", "close_friends", "custom"],
      default: "everyone",
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    views: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        firstViewedAt: { type: Date, default: Date.now },
        lastViewedAt: { type: Date, default: Date.now },
        viewCount: { type: Number, default: 1 }
      }
    ],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String, required: true },
        reactedAt: { type: Date, default: Date.now }
      }
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// TTL index to automatically delete or archive stories after 24 hours.
// In this case, we might just filter them out by expiresAt instead of true deletion
// so the user can keep them in their archive.

const Story = mongoose.model("Story", storySchema);

export default Story;
