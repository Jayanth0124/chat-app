import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createStory, getStories, viewStory, reactToStory, deleteStory, getStoryStats, updateStoryPrivacy } from "../controllers/story.controller.js";

const router = express.Router();

router.post("/", protectRoute, createStory);
router.get("/", protectRoute, getStories);
router.get("/stats", protectRoute, getStoryStats);
router.post("/:storyId/view", protectRoute, viewStory);
router.post("/:storyId/react", protectRoute, reactToStory);
router.put("/:storyId/privacy", protectRoute, updateStoryPrivacy);
router.delete("/:storyId", protectRoute, deleteStory);

export default router;
