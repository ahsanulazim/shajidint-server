import express from "express";
import {
  trackVisit,
  getVisitorStats,
} from "../controllers/visitorController.js";

const router = express.Router();

router.post("/track", trackVisit);
router.get("/stats", getVisitorStats);

export default router;
