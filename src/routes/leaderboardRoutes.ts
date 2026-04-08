import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getDailyLeaderboard, getLeaderboardOverview, getMonthlyLeaderboard, getMostImprovedAgent, getWeeklyLeaderboard } from "../controllers/leaderboardController";

const router = Router();

router.use(protect);

router.get("/overview", getLeaderboardOverview);
router.get("/daily", getDailyLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);
router.get("/monthly", getMonthlyLeaderboard);
router.get("/most-improved", getMostImprovedAgent);

export default router;