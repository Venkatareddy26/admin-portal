import express from "express";
import { getKPIs } from "../controllers/kpiController.js";

const router = express.Router();

router.get("/", getKPIs);

export default router;
