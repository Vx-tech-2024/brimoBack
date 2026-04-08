"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const targetController_1 = require("../controllers/targetController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
/* Agent */
router.get("/agents", targetController_1.getAllAgentMonthlyTargets);
router.get("/agents/:id", targetController_1.getAgentMonthlyTargetById);
router.post("/agents", targetController_1.createAgentMonthlyTarget);
router.put("/agents/:id", targetController_1.updateAgentMonthlyTarget);
router.delete("/agents/:id", targetController_1.deleteAgentMonthlyTarget);
/* Team */
router.get("/team", targetController_1.getAllTeamMonthlyTargets);
router.get("/team/:id", targetController_1.getTeamMonthlyTargetById);
router.post("/team", targetController_1.createTeamMonthlyTarget);
router.put("/team/:id", targetController_1.updateTeamMonthlyTarget);
router.delete("/team/:id", targetController_1.deleteTeamMonthlyTarget);
exports.default = router;
