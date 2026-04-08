import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { exportMonthlyReportCsv, getDailyReport, getMonthlyReport, getWeeklyReport } from "../controllers/reportController";

const router = Router();

router.use(protect);

router.get("/daily", getDailyReport);
router.get("/weekly", getWeeklyReport);
router.get("/monthly", getMonthlyReport);
router.get("/export/csv/monthly", exportMonthlyReportCsv);

export default router;