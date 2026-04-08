import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createTeamMember, deleteTeamMember, getAllTeamMembers, getTeamMemberById, updateTeamMember } from "../controllers/teamMemberController";

const router = Router();

router.use(protect);

router.get("/", getAllTeamMembers);
router.get("/:id", getTeamMemberById);
router.post("/", createTeamMember);
router.put("/:id", updateTeamMember);
router.delete("/:id", deleteTeamMember);

export default router;