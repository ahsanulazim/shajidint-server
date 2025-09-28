import express from "express";
import {
  trackVisit,
  getVisitorStats,
  monthlyVisitor,
} from "../controllers/visitorController.js";

const router = express.Router();

router.post("/track-visitor", trackVisit);
router.get("/visitor-stats", getVisitorStats);
router.get("/monthly-summary", monthlyVisitor);

export default router;
