import express from "express";
import { getTrips } from "../controllers/tripsController.js";

const router = express.Router();

router.get("/", getTrips);

export default router;
