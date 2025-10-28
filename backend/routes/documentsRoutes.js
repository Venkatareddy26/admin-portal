import express from "express";
import { getDocuments } from "../controllers/documentsController.js";

const router = express.Router();

router.get("/", getDocuments);

export default router;
