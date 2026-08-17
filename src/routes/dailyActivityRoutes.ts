import { Router } from "express";
import { createDailyActivity, getDailyActivities, updateDailyActivity, deleteDailyActivity } from "../controllers/dailyActivityController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getDailyActivities);
router.post("/", protect, createDailyActivity);
router.put("/", protect, updateDailyActivity);
router.delete("/", protect, deleteDailyActivity);

export default router;