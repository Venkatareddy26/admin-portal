import express from "express";
import { getTrips, createTrip, updateTrip, deleteTrip } from "../controllers/tripsController.js";

const router = express.Router();

router.get("/", getTrips);
router.post("/", createTrip);
router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

export default router;
