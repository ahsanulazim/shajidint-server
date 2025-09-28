import express from "express";
import { trackVisit, getVisitorStats } from "../controllers/visitorController.js";

const router = express.Router();

router.post("/track-visitor", trackVisit);
router.get("/visitor-stats", getVisitorStats);

export default router;