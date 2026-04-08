import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getAgentPerformanceTracker, getMonthlyGoalTracker, getTargetAchievedRate, getTeamPerformanceSummary } from "../controllers/perfomanceControllers";

const router = Router();

router.use(protect);

router.get("/agent-tracker", getAgentPerformanceTracker);
router.get("/monthly-goal-tracker", getMonthlyGoalTracker);
router.get("/target-achieved-rate", getTargetAchievedRate);
router.get("/team-summary", getTeamPerformanceSummary);

export default router;