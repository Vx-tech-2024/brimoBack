import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createAgentMonthlyTarget, createTeamMonthlyTarget, deleteAgentMonthlyTarget, deleteTeamMonthlyTarget, getAgentMonthlyTargetById, getAllAgentMonthlyTargets, getAllTeamMonthlyTargets, getTeamMonthlyTargetById, updateAgentMonthlyTarget, updateTeamMonthlyTarget, } from "../controllers/targetController";

const router = Router();

router.use(protect);

/* Agent */
router.get("/agents", getAllAgentMonthlyTargets);
router.get("/agents/:id", getAgentMonthlyTargetById);
router.post("/agents", createAgentMonthlyTarget);
router.put("/agents/:id", updateAgentMonthlyTarget);
router.delete("/agents/:id", deleteAgentMonthlyTarget);

/* Team */
router.get("/team", getAllTeamMonthlyTargets);
router.get("/team/:id", getTeamMonthlyTargetById);
router.post("/team", createTeamMonthlyTarget);
router.put("/team/:id", updateTeamMonthlyTarget);
router.delete("/team/:id", deleteTeamMonthlyTarget);

export default router;