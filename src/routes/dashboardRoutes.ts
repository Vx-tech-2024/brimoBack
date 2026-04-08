import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getDailySummary, getLoanMonitoringSummary } from "../controllers/dashboardController";

const router = Router();

router.use(protect);

router.get("/daily-summary", getDailySummary);
router.get("/loan-monitoring-summary", getLoanMonitoringSummary);

export default router;