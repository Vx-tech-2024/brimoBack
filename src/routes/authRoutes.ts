import { Router } from "express";
import { getCurrentAdmin, loginAdmin, logoutAdmin } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", protect, getCurrentAdmin);

export default router;