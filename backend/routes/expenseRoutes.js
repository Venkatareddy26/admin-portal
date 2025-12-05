// backend/routes/expenseRoutes.js
/*import express from "express";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../controllers/expenseController.js";

const router = express.Router();

router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
*/
// backend/routes/expenseRoutes.js
import express from "express";
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  updateExpenseStatus
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.put("/:id/status", updateExpenseStatus);  // ⭐ Add Approve/Reject
router.delete("/:id", deleteExpense);

export default router;
