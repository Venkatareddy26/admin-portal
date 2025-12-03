import express from "express";
import { getDocuments, createDocument, updateDocument, deleteDocument } from "../controllers/documentsController.js";

const router = express.Router();

router.get("/", getDocuments);
router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
