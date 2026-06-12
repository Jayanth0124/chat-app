import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createStory, getStories, viewStory, reactToStory, deleteStory } from "../controllers/story.controller.js";

const router = express.Router();

router.post("/", protectRoute, createStory);
router.get("/", protectRoute, getStories);
router.post("/:storyId/view", protectRoute, viewStory);
router.post("/:storyId/react", protectRoute, reactToStory);
router.delete("/:storyId", protectRoute, deleteStory);

export default router;
