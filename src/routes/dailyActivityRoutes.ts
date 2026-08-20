import { Router } from "express";
import { createDailyActivity, getDailyActivities, updateDailyActivity, deleteDailyActivity } from "../controllers/dailyActivityController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getDailyActivities);
router.post("/", protect, createDailyActivity);
router.put("/:id", protect, updateDailyActivity);
router.delete("/:id", protect, deleteDailyActivity);

export default router;