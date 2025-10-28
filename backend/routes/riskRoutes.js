import express from "express";
import { getRisks } from "../controllers/riskController.js";

const router = express.Router();

router.get("/", getRisks);

export default router;
