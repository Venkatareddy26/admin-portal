import express from "express";
import { getAnalytics, clearAllData } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/", getAnalytics);
router.delete("/clear", clearAllData);

export default router;
