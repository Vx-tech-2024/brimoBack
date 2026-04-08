import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { createLoanEntry, deleteLoanEntry, getAllLoanEntries, getLoanEntryById, updateLoanEntry } from "../controllers/loanController";

const router = Router();

router.use(protect);

router.get("/", getAllLoanEntries);
router.get("/:id", getLoanEntryById);
router.post("/", createLoanEntry);
router.put("/:id", updateLoanEntry);
router.delete("/:id", deleteLoanEntry);

export default router;