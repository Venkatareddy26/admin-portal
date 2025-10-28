import express from "express";
import { getPolicies } from "../controllers/policyController.js";

const router = express.Router();

router.get("/", getPolicies);

export default router;
